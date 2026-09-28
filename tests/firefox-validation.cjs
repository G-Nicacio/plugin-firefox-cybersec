const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");
let sequence = 0;
const pending = new Map();
const socket = net.connect(2829, "127.0.0.1");
let buffer = Buffer.alloc(0);
const hello = new Promise((resolve, reject) => {
  socket.on("error", reject);
  socket.on("data", chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const colon = buffer.indexOf(58);
      if (colon < 0) break;
      const length = Number(buffer.subarray(0, colon).toString());
      if (buffer.length < colon + 1 + length) break;
      const packet = JSON.parse(buffer.subarray(colon + 1, colon + 1 + length).toString());
      buffer = buffer.subarray(colon + 1 + length);
      if (!Array.isArray(packet)) resolve(packet);
      else {
        const task = pending.get(packet[1]);
        if (task) { pending.delete(packet[1]); clearTimeout(task.timer); packet[2] ? task.reject(packet[2]) : task.resolve(packet[3]); }
      }
    }
  });
});
function call(name, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error("Timeout: " + name)); }, 30000);
    pending.set(id, { resolve, reject, timer });
    const data = JSON.stringify([0, id, name, params]);
    socket.write(Buffer.byteLength(data) + ":" + data);
  });
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const execute = async script => (await call("WebDriver:ExecuteScript", {script, args: [], sandbox: null})).value;
const asyncExecute = async script => (await call("WebDriver:ExecuteAsyncScript", {script, args: [], sandbox: null})).value;
(async () => {
  await hello;
  const session = await call("WebDriver:NewSession", {});
  await call("Addon:Install", { path: path.resolve("extension"), temporary: true });
  await call("WebDriver:SwitchToWindow", {handle:(await call("WebDriver:GetWindowHandles"))[0]}); await call("WebDriver:Navigate", {url: "https://privacy-test-pages.site/"});
  const pageHandle = (await call("WebDriver:GetWindowHandles"))[0];
  await call("Marionette:SetContext", {value: "chrome"});
  const extensionUuid = await execute("return JSON.parse(Services.prefs.getStringPref('extensions.webextensions.uuids'))['privacy-inspector@insper.local']");
  await execute("gBrowser.selectedTab = gBrowser.addTab(" + JSON.stringify("moz-extension://" + extensionUuid + "/popup/popup.html") + ", {triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal()});");
  await call("Marionette:SetContext", {value: "content"});
  const popupHandle = (await call("WebDriver:GetWindowHandles")).at(-1);
  await call("WebDriver:SwitchToWindow", {handle: popupHandle});
  await wait(500);
  const tabs = await asyncExecute("const done=arguments[arguments.length-1]; browser.tabs.query({}).then(done);");
  const tabId = tabs.find(t => t.url.startsWith("https://privacy-test-pages.site/")).id;
  fs.mkdirSync("evidencias/ddg", {recursive:true});
  fs.mkdirSync("evidencias/screenshots", {recursive:true});
  const cases = [
    ["tracker-reporting", "/tracker-reporting/1major-via-script.html", null],
    ["canvas", "/privacy-protections/fingerprinting/canvas.html", null],
    ["storage-blocking", "/privacy-protections/storage-blocking/", "Store data"],
    ["storage-partitioning", "/privacy-protections/storage-partitioning/", "Run Tests"],
    ["tracker-blocking", "/privacy-protections/request-blocking/", "Start the test"],
    ["query-parameters", "/privacy-protections/query-parameters/", null],
    ["bounce-tracking", "/privacy-protections/bounce-tracking/", null],
    ["js-leaks", "/security/js-leaks.html#firefox_92", null]
  ];
  for (const [name, route, button] of cases) {
    await call("WebDriver:SwitchToWindow", {handle: popupHandle});
    await asyncExecute("const done=arguments[arguments.length-1]; Promise.all(['ads','trackers','custom'].map(category=>browser.runtime.sendMessage({type:'SET_FILTER_SETTING', category, enabled:" + (name === "tracker-blocking") + "}))).then(done);");
    await call("WebDriver:SwitchToWindow", {handle: pageHandle});
    await call("WebDriver:Navigate", {url:"https://privacy-test-pages.site" + route});
    await wait(2000);
    if (button) { for(let n=0;n<20;n++){if(await execute("return Array.from(document.querySelectorAll('button,input[type=button]')).some(b=>(b.textContent||b.value).trim()===" + JSON.stringify(button) + " && !b.disabled)")) break; await wait(500); } }
    if (button) await execute("Array.from(document.querySelectorAll('button,input[type=button]')).find(b=>(b.textContent || b.value).trim()===" + JSON.stringify(button) + ")?.click()");
    if (name === "bounce-tracking") await execute("Array.from(document.querySelectorAll('a')).find(a=>a.textContent.trim()==='Go to first-party.site')?.click()");
    if (name === "query-parameters") await execute("Array.from(document.querySelectorAll('a')).find(a=>a.textContent.includes('Link with fbclid'))?.click()");
    await wait(name === "tracker-blocking" || name === "storage-partitioning" ? 8000 : 5500);
    if(name==="storage-partitioning") { await wait(2000); await execute("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Run Tests' && !b.disabled)?.click()"); await wait(12000); } const pageText = await execute("return document.body.innerText");
    const pageUrl = await execute("return location.href");
    const shot = await call("WebDriver:TakeScreenshot", {full: true});
    fs.writeFileSync("evidencias/screenshots/" + name + "-page.png", Buffer.from(shot.value, "base64"));
    await call("WebDriver:SwitchToWindow", {handle: popupHandle});
    const report = await asyncExecute("const done=arguments[arguments.length-1]; browser.runtime.sendMessage({type:'GET_REPORT',tabId:" + tabId + "}).then(report=>{renderReport(report);loadFilterSettings().then(()=>done(report))});");
    fs.writeFileSync("evidencias/ddg/" + name + ".json", JSON.stringify({at:new Date().toISOString(),firefox:session.capabilities.browserVersion,plugin:"0.2.0",mode:name === "tracker-blocking" ? "ON" : "OFF",pageUrl,pageText,report},null,2));
    const popupShot = await call("WebDriver:TakeScreenshot", {full:true});
    fs.writeFileSync("evidencias/screenshots/" + name + "-plugin.png", Buffer.from(popupShot.value, "base64"));
    console.log(name, JSON.stringify({requests:report?.requestCount,canvas:report?.canvas?.detected,storage:report?.storage,bounce:report?.bounceTracking?.suspected,blocked:report?.blockedCounts,score:report?.score}));
  }
  await call("WebDriver:DeleteSession"); socket.end();
})().catch(error => {console.error(error); socket.destroy(); process.exitCode=1});



