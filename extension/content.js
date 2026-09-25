async function inspectStorage() {
  const result = {
    localStorage: false,
    localStorageEntries: 0,
    sessionStorage: false,
    sessionStorageEntries: 0,
    indexedDB: false,
    indexedDBDatabases: []
  };

  try {
    result.localStorageEntries = localStorage.length;
    result.localStorage = localStorage.length > 0;
  } catch (error) {
    console.debug("Privacy Inspector: localStorage unavailable", error);
  }

  try {
    result.sessionStorageEntries = sessionStorage.length;
    result.sessionStorage = sessionStorage.length > 0;
  } catch (error) {
    console.debug("Privacy Inspector: sessionStorage unavailable", error);
  }

  try {
    if (indexedDB.databases) {
      const databases = await indexedDB.databases();

      result.indexedDBDatabases = databases.map((database) => ({
        name: database.name || "unnamed",
        version: database.version || null
      }));

      result.indexedDB = databases.length > 0;
    }
  } catch (error) {
    console.debug("Privacy Inspector: IndexedDB unavailable", error);
  }

  return result;
}

const canvasState = {
  detected: false,
  events: []
};

window.addEventListener(
  "privacy-inspector-canvas",
  (event) => {
    canvasState.detected = true;

    canvasState.events.push({
      method: event.detail.method,
      timestamp: Date.now()
    });
  }
);

async function sendAnalysis() {
  const storage = await inspectStorage();

  await browser.runtime.sendMessage({
    type: "PAGE_ANALYSIS",
    storage,
    canvas: canvasState
  });
}

window.addEventListener("load", () => {
  setTimeout(sendAnalysis, 1000);
});

setInterval(sendAnalysis, 5000);