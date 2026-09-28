function normalizeHostname(hostname) {
  if (!hostname) {
    return "";
  }

  return hostname
    .toLowerCase()
    .replace(/\.$/, "");
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
  if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized) || normalized.includes(":")) return normalized;
  // Explicit fallback, not a complete Public Suffix List.
  const compoundSuffixes = new Set(["co.uk", "org.uk", "ac.uk", "com.br", "org.br", "net.br", "com.au", "co.jp", "co.nz", "github.io", "pages.dev", "appspot.com"]);
  if (compoundSuffixes.has(parts.slice(-2).join("."))) return parts.slice(-3).join(".");

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
    navigationObserved: false,
    thirdPartyDomains: Object.create(null),
    requests: [],
    requestCount: 0,
    blockedCounts: { ads: 0, trackers: 0, custom: 0 },
    detectedCounts: { ads: 0, trackers: 0, custom: 0 },
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
      cookieSyncSuspected: false,
      redirects: [],
      indicators: [],
      suspiciousParameters: [],
      sharedIdentifiers: []
    },
    hijacking: {
      suspected: false,
      websockets: [],
      polling: [],
      hooks: [],
      indicators: []
    },
    blocked: {
        ads: [],
        trackers: [],
        custom: []
    },
    score: 100
  };
}
