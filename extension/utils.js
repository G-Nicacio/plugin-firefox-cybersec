function normalizeHostname(hostname) {
  if (!hostname) {
    return "";
  }

  return hostname
    .toLowerCase()
    .replace(/^www\./, "");
}

function getHostnameFromUrl(url) {
  try {
    return normalizeHostname(new URL(url).hostname);
  } catch {
    return "";
  }
}

function getBaseDomain(hostname) {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return "";
  }

  const parts = normalized.split(".");

  if (parts.length <= 2) {
    return normalized;
  }

  return parts.slice(-2).join(".");
}

function isThirdParty(pageUrl, requestUrl) {
  const pageHost = getHostnameFromUrl(pageUrl);
  const requestHost = getHostnameFromUrl(requestUrl);

  if (!pageHost || !requestHost) {
    return false;
  }

  return getBaseDomain(pageHost) !== getBaseDomain(requestHost);
}

function createEmptyReport(tabId, pageUrl = "") {
  return {
    tabId,
    pageUrl,
    thirdPartyDomains: {},
    requests: [],
    cookies: {
      firstParty: 0,
      thirdParty: 0,
      session: 0,
      persistent: 0
    },
    storage: {
      localStorage: false,
      localStorageEntries: 0,
      sessionStorage: false,
      sessionStorageEntries: 0,
      indexedDB: false,
      indexedDBDatabases: []
    },
    canvas: {
      detected: false,
      events: []
    },
    bounceTracking: {
      suspected: false,
      redirects: []
    },
    hijacking: {
      suspected: false,
      websockets: [],
      indicators: []
    },
    score: 100
  };
}