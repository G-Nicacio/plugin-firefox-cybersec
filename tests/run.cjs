const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
function setup(saved = {}) {
  const listeners = {};
  const event = name => ({ addListener(...args) {
    assert.equal(typeof args[0], "function");
    assert.ok(!listeners[name], "duplicate " + name);
    if (name === "request") assert.deepEqual(Array.from(args[2]), ["blocking"]);
    listeners[name] = args[0];
  } });
  const browser = {
    tabs: { onRemoved: event("removed"), get: async id => ({ id, url: "https://first.test/", cookieStoreId: "firefox-default" }) },
    webRequest: { onBeforeRequest: event("request"), onBeforeRedirect: event("redirect") },
    runtime: { onMessage: event("message"), getURL: value => "moz-extension://test/" + value },
    storage: { local: { get: async () => saved, set: async value => Object.assign(saved, value) } },
    cookies: { getAll: async () => [] }
  };
  const context = vm.createContext({ URL, console, browser, fetch: async url => ({
    ok: true, text: async () => fs.readFileSync(path.join(root, "extension", url.replace("moz-extension://test/", "")), "utf8")
  }) });
  for (const file of ["utils.js", "filter-engine.js", "tracking-detector.js", "background.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, "extension", file), "utf8"), context, { filename: file });
  }
  return { l: listeners, e: code => vm.runInContext(code, context), saved, browser };
}
const popup = { url: "moz-extension://test/popup/popup.html" };
const req = (extra = {}) => ({ tabId: 1, requestId: "nav1", type: "main_frame", url: "https://first.test/", timeStamp: 1000, method: "GET", ...extra });
let passed = 0;
async function check(name, fn) { await fn(); console.log("PASS " + name); passed++; }
(async () => {
  await check("listeners and blocked main-frame report", async () => {
    const { l, e } = setup({ customBlocklist: ["first.test"] });
    assert.equal((await l.request(req())).cancel, true);
    assert.equal(e("getReport(1).pageUrl"), "https://first.test/");
    assert.equal(e("getReport(1).requestCount"), 1);
    assert.equal(e("getReport(1).blockedCounts.custom"), 1);
  });
  await check("detection with blocking ON and OFF", async () => {
    const { l, e } = setup();
    await l.request(req());
    await l.request(req({ type: "script", url: "https://google-analytics.com/a" }));
    assert.equal(e("getReport(1).thirdPartyDomains['google-analytics.com'].blocked"), 1);
    await l.message({ type: "SET_FILTER_SETTING", category: "trackers", enabled: false }, popup);
    assert.equal((await l.request(req({ type: "script", url: "https://google-analytics.com/a" }))).cancel, false);
    assert.equal(e("getReport(1).detectedCounts.trackers"), 2);
    assert.equal(e("getReport(1).blockedCounts.trackers"), 1);
  });
  await check("settings survive background recreation", async () => {
    const one = setup();
    await one.l.message({ type: "SET_FILTER_SETTING", category: "ads", enabled: false }, popup);
    await one.l.message({ type: "ADD_BLOCK_DOMAIN", domain: "example.com" }, popup);
    const two = setup(one.saved);
    await two.l.request(req());
    assert.equal(two.e("filterEngine.enabled.ads"), false);
    assert.equal(two.e("filterEngine.custom.has('example.com')"), true);
  });
  await check("strict parser and domain boundaries", async () => {
    const { l, e } = setup();
    await l.request(req());
    for (const value of ["||example.com^$script", "https://example.com/path", "example.com:80", "bad host.com", "*", "-bad.com"]) {
      assert.equal(e("filterEngine.normalizeDomain(" + JSON.stringify(value) + ")"), "");
    }
    assert.equal(e("filterEngine.classify('https://notgoogle-analytics.com/').blocked"), false);
    assert.equal(e("filterEngine.classify('https://sub.google-analytics.com/').blocked"), true);
    e("filterEngine.custom.add('google-analytics.com'); filterEngine.enabled.custom=false");
    assert.equal(e("filterEngine.classify('https://google-analytics.com/').category"), "tracker");
  });
  await check("short named UID versus generic IDs and marketing labels", async () => {
    const { e } = setup();
    assert.equal(e("trackingDetector.findSharedIdentifiers('https://a.test/?uid=63','https://b.test/?id=63').length"), 1);
    assert.equal(e("trackingDetector.findSharedIdentifiers('https://a.test/?id=63','https://b.test/?id=63').length"), 0);
    assert.equal(e("trackingDetector.findSharedIdentifiers('https://a.test/?utm_source=newsletter','https://b.test/?utm_source=newsletter').length"), 0);
  });
  await check("redirect chain survives subresource; new navigation resets", async () => {
    const { l, e } = setup();
    await l.request(req());
    l.redirect(req({ redirectUrl: "https://second.test/?uid=63" }));
    l.redirect(req({ type: "image", requestId: "image", url: "https://img.test/a", redirectUrl: "https://cdn.test/a" }));
    await l.request(req({ url: "https://second.test/?uid=63", timeStamp: 1100 }));
    assert.equal(e("getReport(1).requestCount"), 2);
    assert.equal(e("getReport(1).bounceTracking.suspected"), true);
    assert.equal(e("getReport(1).bounceTracking.cookieSyncSuspected"), false);
    await l.request(req({ requestId: "nav2", url: "https://new.test/", timeStamp: 2000 }));
    assert.equal(e("getReport(1).requestCount"), 1);
    assert.equal(e("getReport(1).bounceTracking.suspected"), false);
  });
  await check("polling time span and WebSocket not proof of hijacking", async () => {
    const { l, e } = setup();
    await l.request(req());
    await l.request(req({ type: "websocket", url: "wss://third.test/socket" }));
    assert.equal(e("getReport(1).hijacking.suspected"), false);
    for (let i = 0; i < 5; i++) await l.request(req({ type: "xmlhttprequest", url: "https://third.test/poll?n=" + i, timeStamp: 1000 + i * 10 }));
    assert.equal(e("getReport(1).hijacking.polling.length"), 0);
    await l.request(req({ type: "xmlhttprequest", url: "https://third.test/poll?n=6", timeStamp: 11000 }));
    assert.equal(e("getReport(1).hijacking.polling.length"), 1);
  });
  await check("DDG client-side bounce preserves short UID and tracker attempt", async () => {
    const { l, e } = setup({ filterSettings: { trackers: false } });
    await l.request(req({ url: "https://bad.third-party.site/bounce" }));
    await l.request(req({ requestId: "client-nav", url: "https://first.test/?bounceUIDcookie=63", timeStamp: 1300 }));
    assert.equal(e("getReport(1).bounceTracking.suspected"), true);
    assert.equal(e("getReport(1).requestCount"), 2);
    assert.equal(e("getReport(1).bounceTracking.cookieSyncSuspected"), false);
    assert.equal(e("getReport(1).bounceTracking.suspiciousParameters[0].name"), "bounceuidcookie");
  });
  await check("history caps and tab cleanup", async () => {
    const { l, e } = setup();
    await l.request(req());
    for (let i = 0; i < 250; i++) await l.request(req({ type: "script", url: "https://google-analytics.com/" + i }));
    assert.equal(e("getReport(1).requests.length"), 200);
    assert.equal(e("getReport(1).blockedCounts.trackers"), 250);
    l.removed(1);
    assert.equal(e("reports.size + trackingSessions.size + pollingSessions.size + frameReports.size"), 0);
  });
  await check("cookie deduplication, partitions and persistence", async () => {
    const { l, browser } = setup();
    browser.cookies.getAll = async ({ url }) => url.includes("third.test") ? [
      { name: "uid", domain: "third.test", path: "/", session: false, partitionKey: { topLevelSite: "https://first.test" } },
      { name: "other", domain: "third.test", path: "/", session: false, partitionKey: { topLevelSite: "https://unrelated.test" } }
    ] : [{ name: "session", domain: "first.test", path: "/", session: true }];
    await l.request(req());
    await l.request(req({ type: "script", url: "https://third.test/a" }));
    await l.request(req({ type: "script", url: "https://third.test/b" }));
    const report = await l.message({ type: "GET_REPORT", tabId: 1 }, popup);
    assert.equal(report.cookies.firstParty, 1);
    assert.equal(report.cookies.thirdPartyPersistent, 1);
    assert.equal(report.cookies.session, 1);
  });
  await check("content cannot change filters; frame analysis aggregates", async () => {
    const { l, e } = setup();
    await l.request(req());
    await l.message({ type: "ADD_BLOCK_DOMAIN", domain: "first.test" }, { tab: { id: 1 }, frameId: 0 });
    assert.equal(e("filterEngine.custom.size"), 0);
    for (const frameId of [0, 1]) await l.message({
      type: "PAGE_ANALYSIS", storage: { localStorage: true, localStorageEntries: 2 },
      canvas: { events: [{ method: "toBlob" }] }, hooks: []
    }, { tab: { id: 1 }, frameId, url: "https://first.test/" });
    assert.equal(e("getReport(1).storage.localStorageEntries"), 2);
    assert.equal(e("getReport(1).canvas.detected"), true);
  });
  await check("suffix fallback and IP addresses", async () => {
    const { e } = setup();
    assert.equal(e("isThirdParty('https://a.example.co.uk','https://b.example.co.uk')"), false);
    assert.equal(e("isThirdParty('https://a.co.uk','https://b.co.uk')"), true);
    assert.equal(e("getBaseDomain('127.0.0.1')"), "127.0.0.1");
  });
  await check("score avoids bounce/sync double counting", async () => {
    const { e } = setup();
    e("var report = createEmptyReport(1); report.bounceTracking.suspected=true; report.bounceTracking.cookieSyncSuspected=true");
    assert.equal(e("calculateScore(report)"), 80);
  });
  await check("canvas wrappers preserve returns, callbacks, errors and hostile metadata", async () => {
    const events = [];
    const intervals = [];
    class Canvas {
      toDataURL(value) { if (!(this instanceof Canvas)) throw new TypeError("receiver"); return value; }
      toBlob(callback) { callback("blob"); }
    }
    class Context { getImageData() { return "pixels"; } }
    const window = { dispatchEvent: event => events.push(event), addEventListener() {}, fetch() {},
      XMLHttpRequest: function XHR() {}, WebSocket: function WS() {} };
    const context = vm.createContext({ window, document: { hidden: false },
      CustomEvent: class { constructor(type, data) { this.type = type; this.detail = data.detail; } },
      HTMLCanvasElement: Canvas, CanvasRenderingContext2D: Context,
      XMLHttpRequest: window.XMLHttpRequest, setInterval: fn => intervals.push(fn) });
    vm.runInContext(fs.readFileSync(path.join(root, "extension/page-script.js"), "utf8"), context);
    const canvas = new Canvas();
    assert.equal(canvas.toDataURL("original"), "original");
    let callback;
    canvas.toBlob(value => { callback = value; });
    assert.equal(callback, "blob");
    assert.throws(() => Canvas.prototype.toDataURL.call({}), TypeError);
    Object.defineProperty(canvas, "canvas", { get() { throw new Error("hostile getter"); } });
    assert.equal(canvas.toDataURL("still original"), "still original");
    intervals[0]();
    assert.equal(events.filter(event => event.type.endsWith("hook")).length, 0);
    window.fetch = function replacement() {};
    intervals[0]();
    assert.equal(events.filter(event => event.type.endsWith("hook")).length, 1);
  });
  console.log(passed + " tests passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
