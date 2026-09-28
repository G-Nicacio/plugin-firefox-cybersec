const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn, execFileSync } = require("node:child_process");
const { Marionette, wait } = require("./marionette-client.cjs");
const { sanitizeHar, sanitizeReport, analyzeHar, writeJson, redactUrl } = require("./evidence-lib.cjs");
const root=path.join(__dirname,"..");
const config=JSON.parse(fs.readFileSync(path.join(__dirname,"real-sites.config.json"),"utf8"));
async function collect(slug,mode){
  const site=config.sites.find(s=>s.slug===slug),settings=config.modes[mode];
  if(!site||!settings)throw new Error("Site/modo inválido");
  if(mode==="ublock"&&!fs.existsSync(path.join(root,".tmp/ublock.xpi")))throw new Error("uBlock oficial ausente em .tmp/ublock.xpi");
  const runId=new Date().toISOString().replace(/[:.]/g,"-");
  const output=path.join(root,"evidencias/sites-reais",slug,mode);
  if(fs.existsSync(path.join(output,"metadata.json"))&&!process.argv.includes("--replace"))throw new Error("Evidência existe; use --replace somente para recolher esta execução deliberadamente");
  const profile=path.join(root,".tmp/real-sites",slug+"-"+mode+"-"+runId);
  fs.mkdirSync(profile,{recursive:true});fs.mkdirSync(output,{recursive:true});
  const prefs={
    "marionette.port":2830,"browser.shell.checkDefaultBrowser":false,
    "browser.startup.homepage_override.mstone":"ignore","browser.startup.page":0,
    "datareporting.policy.dataSubmissionEnabled":false,"browser.contentblocking.category":"standard",
    "privacy.trackingprotection.enabled":false,"privacy.trackingprotection.pbmode.enabled":true,
    "network.cookie.cookieBehavior":5,"devtools.netmonitor.persistlog":true,
    "devtools.netmonitor.har.includeResponseBodies":false,"devtools.cache.disabled":false
  };
  fs.writeFileSync(path.join(profile,"user.js"),Object.entries(prefs).map(([k,v])=>"user_pref("+JSON.stringify(k)+","+JSON.stringify(v)+");").join("\n"));
  const firefox=process.env.FIREFOX_BINARY||path.join(process.env.ProgramFiles,"Mozilla Firefox/firefox.exe");
  const child=spawn(firefox,["-headless","-no-remote","-marionette","--remote-allow-system-access","-profile",profile],{windowsHide:true,stdio:"ignore"});
  let m,metadata={site:site.name,url:site.url,timestamp:new Date().toISOString(),mode,profile:"NEW empty profile per site/mode",login:false,
    consent:config.consent,actions:[],settings,os:os.type()+" "+os.release(),commit:execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim(),
    observationSeconds:config.observationSeconds,status:"started",harSource:"Firefox DevTools Network Monitor HarExporter, not reconstructed from extension data"};
  try {
    m=await Marionette.connect();
    const session=await m.call("WebDriver:NewSession",{pageLoadStrategy:"none"});
    await m.call("WebDriver:SetTimeouts",{script:60000,pageLoad:45000});
    metadata.firefoxVersion=session.capabilities.browserVersion;
    await m.call("WebDriver:SetWindowRect",{width:config.viewport.width,height:config.viewport.height});
    await m.call("Addon:Install",{path:path.join(root,"extension"),temporary:true});
    if(mode==="ublock")await m.call("Addon:Install",{path:path.join(root,".tmp/ublock.xpi"),temporary:true});
    const pageHandle=(await m.call("WebDriver:GetWindowHandles"))[0];
    await m.switchTo(pageHandle);
    await m.call("WebDriver:Navigate",{url:"about:blank"});
    await m.context("chrome");
    metadata.etp=await m.execute("return Object.fromEntries(['browser.contentblocking.category','privacy.trackingprotection.enabled','privacy.trackingprotection.pbmode.enabled','network.cookie.cookieBehavior','privacy.fingerprintingProtection','privacy.resistFingerprinting'].map(k=>{const t=Services.prefs.getPrefType(k);return [k,t===128?Services.prefs.getBoolPref(k):t===64?Services.prefs.getIntPref(k):t===32?Services.prefs.getStringPref(k):null]}))");
    const uuid=await m.execute("return JSON.parse(Services.prefs.getStringPref('extensions.webextensions.uuids'))['privacy-inspector@insper.local']");
    await m.execute("gBrowser.selectedTab=gBrowser.addTab("+JSON.stringify("moz-extension://"+uuid+"/popup/popup.html")+",{triggeringPrincipal:Services.scriptSecurityManager.getSystemPrincipal()});");
    await m.context("content");
    const popupHandle=(await m.call("WebDriver:GetWindowHandles")).at(-1);
    await m.switchTo(popupHandle);await wait(500);
    const setup=await m.asyncExecute("const tabs=await browser.tabs.query({}); const tab=tabs.find(t=>t.url==='about:blank'); for(const [category,enabled] of Object.entries("+JSON.stringify(settings)+")){if(category!=='ublock')await browser.runtime.sendMessage({type:'SET_FILTER_SETTING',category,enabled})} return {tabId:tab.id,version:browser.runtime.getManifest().version};");
    metadata.pluginVersion=setup.version;
    metadata.pluginTabId=setup.tabId;
    if(mode==="ublock")throw new Error("uBlock logger integration not configured yet");
    await m.switchTo(pageHandle);await m.context("chrome");
    await m.asyncExecute("window.__piRequire=ChromeUtils.importESModule('resource://devtools/shared/loader/Loader.sys.mjs').require; const {gDevTools}=window.__piRequire('resource://devtools/client/framework/devtools.js'); window.__piToolbox=await gDevTools.showToolboxForTab(gBrowser.selectedTab,{toolId:'netmonitor',hostType:'window'}); return true;");
    await m.switchTo(pageHandle);
    const started=Date.now();metadata.navigationStartedAt=new Date(started).toISOString();
    await m.call("WebDriver:Navigate",{url:site.url});
    for(const second of config.scrollAtSeconds){
      await wait(Math.max(0,started+second*1000-Date.now()));
      try {const scroll=await m.execute("window.scrollBy(0,"+config.scrollPixels+"); return {url:location.href,y:scrollY,height:innerHeight};");metadata.actions.push({atSeconds:(Date.now()-started)/1000,scroll:sanitizeReport(scroll)});}
      catch(error){metadata.actions.push({atSeconds:(Date.now()-started)/1000,error:String(error)})}
    }
    await wait(Math.max(0,started+config.observationSeconds*1000-Date.now()));
    const page=await m.execute("return {url:location.href,title:document.title,text:document.body?.innerText?.slice(0,20000)||'',viewport:{width:innerWidth,height:innerHeight},readyState:document.readyState}");
    metadata.finalUrl=redactUrl(page.url);metadata.observedSeconds=(Date.now()-started)/1000;
    writeJson(path.join(output,"page-observation.json"),{...page,url:redactUrl(page.url)});
    fs.writeFileSync(path.join(output,"page.png"),Buffer.from((await m.call("WebDriver:TakeScreenshot",{full:false})).value,"base64"));
    await m.context("chrome");
    const har=await m.asyncExecute("return await window.__piToolbox.getPanel('netmonitor').panelWin.api.getHar();");
    if(!har?.log?.entries?.length)throw new Error("DevTools retornou HAR vazio");
    const clean=sanitizeHar(har,"Firefox "+metadata.firefoxVersion+" DevTools netmonitor api.getHar()");
    const harFile=path.join(output,slug+"-"+mode+".har");writeJson(harFile,clean);
    await m.switchTo(popupHandle);
    const report=await m.asyncExecute("const report=await browser.runtime.sendMessage({type:'GET_REPORT',tabId:"+setup.tabId+"}); renderReport(report); await loadFilterSettings(); return report;");
    writeJson(path.join(output,"privacy-inspector.json"),{exportedAt:new Date().toISOString(),version:setup.version,report:sanitizeReport(report)});
    fs.writeFileSync(path.join(output,"plugin.png"),Buffer.from((await m.call("WebDriver:TakeScreenshot",{full:true})).value,"base64"));
    writeJson(path.join(output,"har-summary.json"),analyzeHar(clean,metadata.finalUrl,report));
    metadata.status="collected";metadata.harEntries=clean.log.entries.length;
    metadata.reportSamples=report.requests.length;metadata.reportAttempts=report.requestCount;
    metadata.pageAccess="requires inspection of page-observation.json and screenshot; collection alone does not prove site content loaded";
    console.log(JSON.stringify({site:slug,mode,har:metadata.harEntries,requests:report.requestCount,score:report.score,title:page.title}));
  } catch(error){metadata.status="error";metadata.error=String(error);console.error(metadata.error);process.exitCode=1}
  finally {
    metadata.finishedAt=new Date().toISOString();writeJson(path.join(output,"metadata.json"),metadata);
    if(m)await m.quit().catch(()=>{});else child.kill();
  }
}
if(require.main===module)collect(process.argv[2],process.argv[3]||"baseline").catch(error=>{console.error(error);process.exitCode=1});
module.exports={collect};
