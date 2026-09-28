async function inspectStorage() {
  const result = {
    localStorage: false, localStorageEntries: 0,
    sessionStorage: false, sessionStorageEntries: 0,
    indexedDB: false, indexedDBDatabases: [], unavailable: []
  };
  for (const key of ["localStorage", "sessionStorage"]) {
    try {
      result[key + "Entries"] = window[key].length;
      result[key] = result[key + "Entries"] > 0;
    } catch { result.unavailable.push(key); }
  }
  try {
    if (typeof indexedDB.databases !== "function") result.unavailable.push("indexedDB.databases");
    else {
      const databases = await indexedDB.databases();
      result.indexedDBDatabases = databases.slice(0, 100).map(db => ({ name: db.name || "unnamed", version: db.version || null }));
      result.indexedDB = databases.length > 0;
    }
  } catch { result.unavailable.push("indexedDB"); }
  return result;
}
const canvasState = { detected: false, events: [] };
const hookState = [];
let scheduled = false;
let sending = false;
let lastPayload = "";
function scheduleAnalysis() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(() => { scheduled = false; sendAnalysis(); }, 250);
}
for (const kind of ["canvas", "hook"]) {
  window.addEventListener("privacy-inspector-" + kind, event => {
    try {
      // Strings cross Firefox's isolated/main boundary without privileged object access.
      if (typeof event.detail !== "string" || event.detail.length > 2048) return;
      const data = JSON.parse(event.detail);
      const target = kind === "canvas" ? canvasState.events : hookState;
      if (kind === "canvas") {
        if (!["toDataURL", "toBlob", "getImageData"].includes(data.method)) return;
        canvasState.detected = true;
        target.push({ method: data.method, width: Number(data.width) || 0, height: Number(data.height) || 0, timestamp: Date.now() });
      } else {
        if (!["fetch", "XMLHttpRequest", "WebSocket", "open", "send", "toDataURL", "toBlob", "getImageData"].includes(data.api)) return;
        target.push({ api: data.api, timestamp: Date.now() });
      }
      if (target.length > 100) target.shift();
      scheduleAnalysis();
    } catch { /* Ignore malformed page-controlled events. */ }
  });
}
async function sendAnalysis() {
  if (sending) return;
  sending = true;
  try {
    const payload = { type: "PAGE_ANALYSIS", storage: await inspectStorage(), canvas: canvasState, hooks: hookState };
    const serialized = JSON.stringify(payload);
    if (serialized !== lastPayload) {
      await browser.runtime.sendMessage(payload);
      lastPayload = serialized;
    }
  } catch { /* Extension may have been reloaded while this document remains open. */ }
  finally { sending = false; }
}
window.addEventListener("load", scheduleAnalysis);
window.addEventListener("pageshow", () => { lastPayload = ""; scheduleAnalysis(); });
window.addEventListener("storage", scheduleAnalysis);
document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleAnalysis(); });
// Same-document storage writes have no storage event, so use a bounded cadence while visible.
setInterval(() => { if (!document.hidden) sendAnalysis(); }, 5000);
scheduleAnalysis();
