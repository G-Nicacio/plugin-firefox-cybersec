const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const context = vm.createContext({ URL });
vm.runInContext(fs.readFileSync(path.join(root, "extension/utils.js"), "utf8") +
  fs.readFileSync(path.join(root, "extension/filter-engine.js"), "utf8") +
  ";globalThis.api={getBaseDomain,isThirdParty,getSetCookieMetadata,filterEngine};", context);
const { getBaseDomain, isThirdParty, getSetCookieMetadata, filterEngine } = context.api;
for (const category of ["ads", "trackers"]) {
  for (const line of fs.readFileSync(path.join(root, "extension/filters", category + ".txt"), "utf8").split(/\r?\n/)) {
    const domain = filterEngine.normalizeDomain(line.trim().replace(/^\|\|([^|^]+)\^$/, "$1"));
    if (domain) filterEngine[category].add(domain);
  }
}
function redactUrl(value) {
  if (typeof value !== "string") return value;
  try {
    const url = new URL(value);
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) return url.protocol + "[REDACTED]";
    url.username = ""; url.password = ""; url.hash = "";
    url.pathname = url.pathname.split("/").map(segment =>
      segment.length > 40 || /@|%40/i.test(segment) || /^[a-f0-9-]{24,}$/i.test(segment) ? "[REDACTED]" : segment).join("/");
    for (const key of [...url.searchParams.keys()]) url.searchParams.set(key, "[REDACTED]");
    return url.href;
  } catch { return "[INVALID_OR_REDACTED_URL]"; }
}
function sanitizeReport(report) {
  const clone = JSON.parse(JSON.stringify(report));
  const walk = object => {
    if (!object || typeof object !== "object") return;
    for (const [key, value] of Object.entries(object)) {
      if (key === "sharedIdentifiers") object[key] = Array.isArray(value) ? value.map(() => "[REDACTED]") : [];
      else if (key === "value") object[key] = "[REDACTED]";
      else if (typeof value === "string" && /url|endpoint/i.test(key)) object[key] = redactUrl(value);
      else if (typeof value === "string" && /^https?:\/\//.test(value)) object[key] = redactUrl(value);
      else walk(value);
    }
  };
  walk(clone);
  return clone;
}
const safeHeaders = new Set(["content-type", "content-length", "cache-control", "pragma", "expires",
  "date", "age", "vary", "content-encoding", "transfer-encoding", "sec-fetch-site", "sec-fetch-mode", "sec-fetch-dest"]);
function sanitizeHeaders(headers = []) {
  return headers.map(header => ({
    name: header.name,
    value: safeHeaders.has(header.name.toLowerCase()) ? header.value :
      ["location", "referer", "origin"].includes(header.name.toLowerCase()) ? redactUrl(header.value) : "[REDACTED]"
  }));
}
function sanitizeHar(input, source) {
  if (!Array.isArray(input?.log?.entries) || input.log.version !== "1.2") throw new Error("HAR 1.2 inválido");
  const har = JSON.parse(JSON.stringify(input));
  har.log.comment = "Firefox DevTools export; sanitized: URL values, cookie values, non-allowlisted headers and bodies removed.";
  har.log._privacyInspector = { source, sanitized: true, sanitizedAt: new Date().toISOString() };
  for (const page of har.log.pages || []) {
    if (page.title?.startsWith("http")) page.title = redactUrl(page.title);
  }
  for (const entry of har.log.entries) {
    const originalUrl = entry.request.url;
    entry._cookieWriteMetadata = (entry.response.headers || [])
      .filter(header => header.name.toLowerCase() === "set-cookie")
      .map(header => getSetCookieMetadata(header.value, originalUrl, Date.parse(entry.startedDateTime))).filter(Boolean);
    for (const side of ["request", "response"]) {
      const data = entry[side];
      data.headers = sanitizeHeaders(data.headers);
      data.cookies = (data.cookies || []).map(cookie => ({ ...cookie, value: "[REDACTED]" }));
      if (data.postData) data.postData = { mimeType: data.postData.mimeType, comment: "Body omitted for privacy" };
      if (data.content) { delete data.content.text; delete data.content.encoding; }
    }
    entry.request.url = redactUrl(originalUrl);
    entry.request.queryString = (entry.request.queryString || []).map(parameter => ({name:parameter.name,value:"[REDACTED]"}));
    entry.response.redirectURL = entry.response.redirectURL ? redactUrl(entry.response.redirectURL) : "";
    // Optional DevTools stacks may embed URLs/identifiers. Keep only the cause type.
    if (entry._cause) entry._cause = { type: entry._cause.type };
    for (const key of Object.keys(entry)) if (key.startsWith("_") && !["_cause","_resourceType","_securityState","_cookieWriteMetadata"].includes(key)) delete entry[key];
  }
  return har;
}
function analyzeHar(har, pageUrl, report = null) {
  if (!Array.isArray(har?.log?.entries)) throw new Error("Arquivo sem log.entries HAR");
  const hosts = Object.create(null), statuses = Object.create(null), redirects = [], cookieWrites = [];
  let thirdPartyRequests = 0;
  har.log.entries.forEach((entry, index) => {
    const url = new URL(entry.request.url);
    const third = isThirdParty(pageUrl, url.href);
    if (third) thirdPartyRequests++;
    const host = hosts[url.hostname] ||= { requests:0, thirdParty:third, statuses:{}, types:[], harEntries:[], categories:[] };
    host.requests++; host.harEntries.push(index);
    host.statuses[entry.response.status] = (host.statuses[entry.response.status] || 0) + 1;
    statuses[entry.response.status] = (statuses[entry.response.status] || 0) + 1;
    const type = entry._resourceType || entry._cause?.type || "not provided";
    if (!host.types.includes(type)) host.types.push(type);
    host.categories = Array.from(filterEngine.classify(url.href).matches, match => match.category);
    if (entry.response.status >= 300 && entry.response.status < 400) redirects.push({
      entry:index, url:redactUrl(url.href), status:entry.response.status, destination:entry.response.redirectURL || null
    });
    for (const cookie of entry._cookieWriteMetadata || []) cookieWrites.push({ entry:index, ...cookie });
  });
  return {
    totalRequests:har.log.entries.length, firstPartyRequests:har.log.entries.length-thirdPartyRequests,
    thirdPartyRequests, hosts, statuses, redirects, cookieWrites,
    pluginComparison:report ? {
      pluginAttempts:report.requestCount, sampledRequests:report.requests.length,
      hostsOnlyInHar:Object.keys(hosts).filter(host=>!report.thirdPartyDomains?.[host] && isThirdParty(pageUrl,"https://"+host)),
      hostsOnlyInPlugin:Object.keys(report.thirdPartyDomains || {}).filter(host=>!hosts[host]),
      note:"Host-level comparison of the same run. HAR entries and attempted requests are different measurements."
    } : null,
    domainMethod:"Same partial registrable-domain fallback as Privacy Inspector; not a complete PSL."
  };
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file, JSON.stringify(value,null,2)+"\n");
}
module.exports = { redactUrl, sanitizeReport, sanitizeHar, analyzeHar, writeJson, getBaseDomain, filterEngine };
