const reports = new Map();
const trackingSessions = new Map();
const pollingSessions = new Map();
const frameReports = new Map();
const LIMIT = 200;
const pushBounded = (array, item, limit = LIMIT) => {
  array.push(item);
  if (array.length > limit) array.splice(0, array.length - limit);
};
const addIndicator = (array, text) => {
  if (!array.includes(text)) pushBounded(array, text);
};
const filtersReady = Promise.all([filterEngine.loadBuiltInFilters(), filterEngine.loadCustomFilters()])
  .catch(error => filterEngine.errors.push(String(error)));

function getReport(tabId) {
  if (!reports.has(tabId)) reports.set(tabId, createEmptyReport(tabId));
  return reports.get(tabId);
}

function calculateScore(report) {
  const thirdParties = Object.values(report.thirdPartyDomains).filter(item => item.allowed > 0).length;
  const breakdown = {
    thirdParties: Math.min(15, thirdParties),
    cookies: Math.min(20, (report.cookies.thirdPartyPersistent || 0) * 3 + (report.cookies.thirdPartySession || 0)),
    storage: (report.storage.localStorage ? 2 : 0) + (report.storage.sessionStorage ? 1 : 0) + (report.storage.indexedDB ? 2 : 0),
    canvas: report.canvas.detected ? 8 : 0,
    crossSite: report.bounceTracking.cookieSyncSuspected ? 20 : report.bounceTracking.suspected ? 12 : 0,
    security: Math.min(20, (report.hijacking.hooks.length ? 12 : 0) + (report.hijacking.polling.length ? 5 : 0))
  };
  report.scoreBreakdown = breakdown;
  return Math.max(0, 100 - Object.values(breakdown).reduce((sum, value) => sum + value, 0));
}

function createTrackingSession() {
  return { redirects: [], expectedNextUrl: null, requestId: null, lastActivity: 0,
    bounceSuspected: false, cookieSyncSuspected: false, indicators: [],
    suspiciousParameters: [], sharedIdentifiers: [] };
}
function getTrackingSession(tabId) {
  if (!trackingSessions.has(tabId)) trackingSessions.set(tabId, createTrackingSession());
  return trackingSessions.get(tabId);
}
function registerMainFrameRequest(details) {
  if (details.type !== "main_frame") return;
  let session = getTrackingSession(details.tabId);
  const continues = session.expectedNextUrl === details.url &&
    session.requestId === details.requestId && details.timeStamp - session.lastActivity < 10000;
  if (!continues) {
    session = createTrackingSession();
    trackingSessions.set(details.tabId, session);
    reports.set(details.tabId, createEmptyReport(details.tabId, details.url));
    pollingSessions.delete(details.tabId);
    frameReports.delete(details.tabId);
  }
  session.requestId = details.requestId;
  session.expectedNextUrl = null;
  session.lastActivity = details.timeStamp;
  getReport(details.tabId).pageUrl = details.url;
}

browser.tabs.onRemoved.addListener(tabId => {
  reports.delete(tabId); trackingSessions.delete(tabId);
  pollingSessions.delete(tabId); frameReports.delete(tabId);
});
// Do not reset on tabs.onUpdated: it can arrive after the first network events.

function observePolling(report, details, thirdParty) {
  if (!thirdParty || details.type !== "xmlhttprequest") return;
  if (!pollingSessions.has(details.tabId)) pollingSessions.set(details.tabId, new Map());
  const groups = pollingSessions.get(details.tabId);
  const url = new URL(details.url);
  const key = url.origin + url.pathname;
  if (!groups.has(key) && groups.size >= LIMIT) groups.delete(groups.keys().next().value);
  const times = (groups.get(key) || []).filter(time => details.timeStamp - time <= 30000);
  times.push(details.timeStamp);
  groups.set(key, times.slice(-20));
  // A burst alone is not persistent polling: require five requests spanning >= 8 seconds.
  if (times.length >= 5 && times.at(-1) - times[0] >= 8000 &&
      !report.hijacking.polling.some(item => item.endpoint === key)) {
    pushBounded(report.hijacking.polling, { endpoint: key, count: times.length, windowMs: 30000 });
    report.hijacking.suspected = true;
    addIndicator(report.hijacking.indicators, "Possible persistent third-party polling (may be legitimate)");
  }
}

browser.webRequest.onBeforeRequest.addListener(
  async details => {
    if (details.tabId < 0) return {};
    await filtersReady;
    registerMainFrameRequest(details);
    const report = getReport(details.tabId);
    if (!report.pageUrl) report.pageUrl = details.documentUrl || details.originUrl || "";
    const result = filterEngine.classify(details.url);
    const hostname = getHostnameFromUrl(details.url);
    const thirdParty = isThirdParty(report.pageUrl, details.url);
    const request = { url: details.url, hostname, type: details.type, method: details.method,
      timestamp: details.timeStamp, thirdParty, blocked: result.blocked,
      category: result.category, rule: result.rule };
    report.requestCount++;
    pushBounded(report.requests, request);
    for (const match of result.matches) report.detectedCounts[match.key]++;
    if (thirdParty && hostname) {
      if (!report.thirdPartyDomains[hostname] && Object.keys(report.thirdPartyDomains).length < LIMIT) {
        report.thirdPartyDomains[hostname] = { count: 0, blocked: 0, allowed: 0, types: [] };
      }
      const domain = report.thirdPartyDomains[hostname];
      if (domain) {
        domain.count++;
        domain[result.blocked ? "blocked" : "allowed"]++;
        if (!domain.types.includes(details.type)) domain.types.push(details.type);
      } else report.historyTruncated = true;
    }
    if (thirdParty && details.type === "websocket") {
      pushBounded(report.hijacking.websockets, request);
      addIndicator(report.hijacking.indicators, "Third-party WebSocket attempt (not proof of hijacking)");
    }
    if (!result.blocked) observePolling(report, details, thirdParty);
    if (result.blocked) {
      const key = { ad: "ads", tracker: "trackers", custom: "custom" }[result.category];
      report.blockedCounts[key]++;
      pushBounded(report.blocked[key], request);
    }
    const parameters = trackingDetector.getSuspiciousParameters(details.url);
    for (const parameter of parameters) {
      pushBounded(getTrackingSession(details.tabId).suspiciousParameters,
        { name: parameter.name, sourceUrl: details.url, context: "request parameter; not proof of sync" });
    }
    updateBounceReport(details.tabId);
    report.score = calculateScore(report);
    return { cancel: result.blocked };
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

browser.webRequest.onBeforeRedirect.addListener(
  details => {
    if (details.tabId < 0) return;
    const analysis = trackingDetector.analyzeRedirect(details);
    const session = getTrackingSession(details.tabId);
    // A subresource redirect must never take over the top-level navigation chain.
    if (details.type === "main_frame") {
      session.expectedNextUrl = details.redirectUrl;
      session.requestId = details.requestId;
      session.lastActivity = details.timeStamp;
    }
    if (!analysis.crossSite) return;
    pushBounded(session.redirects, analysis);
    const parameters = [...analysis.suspiciousSourceParameters, ...analysis.suspiciousDestinationParameters];
    for (const parameter of parameters) pushBounded(session.suspiciousParameters,
      { name: parameter.name, sourceUrl: analysis.sourceUrl, destinationUrl: analysis.destinationUrl });
    for (const identifier of analysis.sharedIdentifiers) {
      if (!session.sharedIdentifiers.includes(identifier)) pushBounded(session.sharedIdentifiers, identifier);
    }
    if (analysis.sharedIdentifiers.length) {
      session.cookieSyncSuspected = true;
      addIndicator(session.indicators, "Possible identifier sharing across sites; cookie origin unproven");
    }
    const recent = session.redirects.filter(item => item.type === "main_frame" &&
      item.requestId === details.requestId && details.timeStamp - item.timestamp < 5000);
    if (details.type === "main_frame" && (recent.length >= 2 || parameters.some(item => item.name !== "id" && !item.name.startsWith("utm_") && item.name !== "fb_source"))) {
      session.bounceSuspected = true;
      addIndicator(session.indicators, "Possible bounce: rapid redirect chain or named identifier in top-level redirect");
    }
    updateBounceReport(details.tabId);
  },
  { urls: ["<all_urls>"] }
);

function updateBounceReport(tabId) {
  const report = getReport(tabId);
  const session = getTrackingSession(tabId);
  report.bounceTracking = { suspected: session.bounceSuspected, cookieSyncSuspected: session.cookieSyncSuspected,
    redirects: [...session.redirects], indicators: [...session.indicators],
    suspiciousParameters: [...session.suspiciousParameters], sharedIdentifiers: [...session.sharedIdentifiers] };
  report.score = calculateScore(report);
}

async function updateCookiesForTab(tabId) {
  const report = getReport(tabId);
  if (!report.pageUrl) return;
  const summary = { firstParty: 0, thirdParty: 0, session: 0, persistent: 0,
    thirdPartyPersistent: 0, thirdPartySession: 0,
    scope: "Cookie inventory for observed allowed URLs; not a count of cookies injected by this page.",
    errors: 0 };
  const urls = [...new Set([report.pageUrl, ...report.requests.filter(item => !item.blocked).map(item => item.url)])]
    .filter(url => /^https?:/.test(url)).slice(0, LIMIT);
  const cookies = new Map();
  try {
    const tab = await browser.tabs.get(tabId);
    // Respect Firefox container/private cookie stores. Partition visibility depends on Firefox API support.
    for (let index = 0; index < urls.length; index += 10) {
      const batches = await Promise.all(urls.slice(index, index + 10).map(async url => {
        try {
          const values = await browser.cookies.getAll({ url, storeId: tab.cookieStoreId,
            firstPartyDomain: null, partitionKey: {} });
          const top = new URL(report.pageUrl);
          const site = top.protocol + "//" + getBaseDomain(top.hostname);
          return values.filter(cookie => (!cookie.partitionKey?.topLevelSite || cookie.partitionKey.topLevelSite === site) &&
            (!cookie.firstPartyDomain || cookie.firstPartyDomain === getBaseDomain(top.hostname)));
        }
        catch { summary.errors++; return []; }
      }));
      for (const cookie of batches.flat()) {
        const key = JSON.stringify([cookie.storeId, cookie.partitionKey, cookie.firstPartyDomain,
          cookie.domain, cookie.path, cookie.name]);
        cookies.set(key, cookie);
      }
    }
    for (const cookie of cookies.values()) {
      const third = getBaseDomain(cookie.domain.replace(/^\./, "")) !== getBaseDomain(getHostnameFromUrl(report.pageUrl));
      summary[third ? "thirdParty" : "firstParty"]++;
      summary[cookie.session ? "session" : "persistent"]++;
      if (third) summary[cookie.session ? "thirdPartySession" : "thirdPartyPersistent"]++;
    }
  } catch { summary.errors++; }
  if (reports.get(tabId) === report) report.cookies = summary;
}

function acceptPageAnalysis(message, sender) {
  const report = getReport(sender.tab.id);
  if (sender.frameId === 0 && getHostnameFromUrl(sender.url) !== getHostnameFromUrl(report.pageUrl)) return;
  if (!frameReports.has(sender.tab.id)) frameReports.set(sender.tab.id, new Map());
  const frames = frameReports.get(sender.tab.id);
  if (!frames.has(sender.frameId) && frames.size >= 100) return;
  frames.set(sender.frameId, { storage: message.storage, canvas: message.canvas, hooks: message.hooks || [] });
  const storage = createEmptyReport(0).storage;
  storage.unavailable = [];
  const events = [];
  const hooks = [];
  for (const frame of frames.values()) {
    for (const key of ["localStorage", "sessionStorage", "indexedDB"]) storage[key] ||= Boolean(frame.storage?.[key]);
    storage.localStorageEntries += Math.max(0, Number(frame.storage?.localStorageEntries) || 0);
    storage.sessionStorageEntries += Math.max(0, Number(frame.storage?.sessionStorageEntries) || 0);
    storage.indexedDBDatabases.push(...(frame.storage?.indexedDBDatabases || []).slice(0, 100));
    for (const item of frame.storage?.unavailable || []) if (!storage.unavailable.includes(item)) storage.unavailable.push(item);
    events.push(...(frame.canvas?.events || []).slice(-100));
    hooks.push(...frame.hooks.slice(-100));
  }
  storage.indexedDBDatabases = storage.indexedDBDatabases.slice(0, 100);
  report.storage = storage;
  report.canvas = { detected: events.length > 0, events: events.slice(-LIMIT), source: "untrusted MAIN-world instrumentation" };
  report.hijacking.hooks = hooks.slice(-LIMIT);
  report.hijacking.suspected = Boolean(hooks.length || report.hijacking.polling.length);
  if (hooks.length) addIndicator(report.hijacking.indicators, "Possible hook: API reference changed; may be a framework");
  report.score = calculateScore(report);
}

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (!message || typeof message.type !== "string") return;
  if (message.type === "PAGE_ANALYSIS") {
    if (sender.tab && Number.isInteger(sender.frameId)) acceptPageAnalysis(message, sender);
    return { success: true };
  }
  // Page/content messages cannot modify the blocklist or request another tab's report.
  if (sender.tab || !sender.url?.startsWith(browser.runtime.getURL("popup/"))) return;
  await filtersReady;
  if (message.type === "GET_REPORT") {
    if (!Number.isInteger(message.tabId) || message.tabId < 0) return null;
    const tab = await browser.tabs.get(message.tabId);
    const report = getReport(message.tabId);
    if (!report.pageUrl) report.pageUrl = tab.url || "";
    await updateCookiesForTab(message.tabId);
    const current = getReport(message.tabId);
    updateBounceReport(message.tabId);
    current.filterStatus = { ignoredRules: filterEngine.ignoredRules, errors: [...filterEngine.errors] };
    return current;
  }
  if (message.type === "GET_BLOCKLIST") return { domains: [...filterEngine.custom] };
  if (message.type === "GET_FILTER_SETTINGS") return { ...filterEngine.enabled };
  if (message.type === "SET_FILTER_SETTING") {
    if (!Object.hasOwn(filterEngine.enabled, message.category) || typeof message.enabled !== "boolean") return { success: false };
    filterEngine.enabled[message.category] = message.enabled;
    await filterEngine.saveSettings();
    return { success: true, settings: { ...filterEngine.enabled } };
  }
  if (["ADD_BLOCK_DOMAIN", "REMOVE_BLOCK_DOMAIN"].includes(message.type)) {
    const domain = filterEngine.normalizeDomain(message.domain);
    if (!domain) return { success: false, error: "Use somente um domínio válido, como example.com." };
    if (message.type === "ADD_BLOCK_DOMAIN") filterEngine.custom.add(domain);
    else filterEngine.custom.delete(domain);
    await filterEngine.saveCustomFilters();
    return { success: true, domains: [...filterEngine.custom] };
  }
});
