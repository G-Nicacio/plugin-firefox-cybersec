const reports = new Map();

async function initializeFilters() {
  await filterEngine.loadBuiltInFilters();
  await filterEngine.loadCustomFilters();

  console.log(
    "Privacy Inspector filter engine ready"
  );
}

initializeFilters();

function getReport(tabId) {
  if (!reports.has(tabId)) {
    reports.set(
      tabId,
      createEmptyReport(tabId)
    );
  }

  return reports.get(tabId);
}

function calculateScore(report) {
  let score = 100;

  const thirdPartyCount =
    Object.keys(
      report.thirdPartyDomains
    ).length;

  score -= Math.min(
    thirdPartyCount * 2,
    20
  );

  score -= Math.min(
    report.cookies.thirdParty * 2,
    20
  );

  if (
    report.storage.localStorage
  ) {
    score -= 5;
  }

  if (
    report.storage.sessionStorage
  ) {
    score -= 2;
  }

  if (
    report.storage.indexedDB
  ) {
    score -= 5;
  }

  if (
    report.canvas.detected
  ) {
    score -= 15;
  }

  if (
    report.bounceTracking.suspected
  ) {
    score -= 15;
  }

  if (
    report.hijacking.suspected
  ) {
    score -= 20;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

browser.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    if (
      changeInfo.status === "loading" &&
      tab.url
    ) {
      reports.set(
        tabId,
        createEmptyReport(
          tabId,
          tab.url
        )
      );
    }
  }
);

browser.tabs.onRemoved.addListener(
  (tabId) => {
    reports.delete(tabId);
  }
);

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) {
      return;
    }

    const filterResult =
      filterEngine.classify(
        details.url
      );

    if (
      filterResult?.blocked
    ) {
      const report =
        getReport(
          details.tabId
        );

      const blockedRequest = {
        url: details.url,

        hostname:
          getHostnameFromUrl(
            details.url
          ),

        type:
          details.type,

        timestamp:
          details.timeStamp,

        rule:
          filterResult.rule
      };

      if (
        filterResult.category ===
        "ad"
      ) {
        report.blocked.ads.push(
          blockedRequest
        );
      }

      if (
        filterResult.category ===
        "tracker"
      ) {
        report.blocked.trackers.push(
          blockedRequest
        );
      }

      if (
        filterResult.category ===
        "custom"
      ) {
        report.blocked.custom.push(
          blockedRequest
        );
      }

      console.log(
        "Privacy Inspector blocked:",
        filterResult.category,
        details.url
      );

      return {
        cancel: true
      };
    }

    const report =
      getReport(
        details.tabId
      );

    const requestHost =
      getHostnameFromUrl(
        details.url
      );

    const thirdParty =
      isThirdParty(
        report.pageUrl,
        details.url
      );

    const requestData = {
      url:
        details.url,

      hostname:
        requestHost,

      type:
        details.type,

      method:
        details.method,

      timestamp:
        details.timeStamp,

      thirdParty
    };

    report.requests.push(
      requestData
    );

    if (
      thirdParty &&
      requestHost
    ) {
      if (
        !report
          .thirdPartyDomains[
            requestHost
          ]
      ) {
        report
          .thirdPartyDomains[
            requestHost
          ] = {
            count: 0,
            types: []
          };
      }

      report
        .thirdPartyDomains[
          requestHost
        ]
        .count += 1;

      if (
        !report
          .thirdPartyDomains[
            requestHost
          ]
          .types.includes(
            details.type
          )
      ) {
        report
          .thirdPartyDomains[
            requestHost
          ]
          .types.push(
            details.type
          );
      }
    }

    if (
      details.type ===
        "websocket" &&
      thirdParty
    ) {
      report
        .hijacking
        .websockets
        .push({
          url:
            details.url,

          timestamp:
            details.timeStamp
        });

      report
        .hijacking
        .indicators
        .push(
          "Third-party WebSocket connection"
        );
    }

    report.score =
      calculateScore(
        report
      );
  },

  {
    urls: [
      "<all_urls>"
    ]
  },

  ["blocking"]
);

browser.runtime.onMessage.addListener(
  async (
    message,
    sender
  ) => {
    const tabId =
      sender.tab?.id ??
      message.tabId;

    if (
      message.type ===
        "PAGE_ANALYSIS" &&
      tabId !== undefined
    ) {
      const report =
        getReport(tabId);

      report.storage =
        message.storage;

      report.canvas =
        message.canvas;

      report.score =
        calculateScore(
          report
        );

      return {
        success: true
      };
    }

    if (
      message.type ===
      "GET_REPORT"
    ) {
      await updateCookiesForTab(
        message.tabId
      );

      const report =
        getReport(
          message.tabId
        );

      report.score =
        calculateScore(
          report
        );

      return report;
    }

    if (
      message.type ===
      "GET_BLOCKLIST"
    ) {
      return {
        domains:
          Array.from(
            filterEngine.custom
          )
      };
    }

    if (
      message.type ===
      "ADD_BLOCK_DOMAIN"
    ) {
      const domain =
        filterEngine
          .normalizeDomain(
            message.domain
          );

      if (!domain) {
        return {
          success: false,
          error:
            "Invalid domain"
        };
      }

      filterEngine
        .custom
        .add(domain);

      await filterEngine
        .saveCustomFilters();

      return {
        success: true,

        domains:
          Array.from(
            filterEngine.custom
          )
      };
    }

    if (
      message.type ===
      "REMOVE_BLOCK_DOMAIN"
    ) {
      const domain =
        filterEngine
          .normalizeDomain(
            message.domain
          );

      filterEngine
        .custom
        .delete(domain);

      await filterEngine
        .saveCustomFilters();

      return {
        success: true,

        domains:
          Array.from(
            filterEngine.custom
          )
      };
    }

    if (
      message.type ===
      "GET_FILTER_SETTINGS"
    ) {
      return {
        ...filterEngine.enabled
      };
    }

    if (
      message.type ===
      "SET_FILTER_SETTING"
    ) {
      const {
        category,
        enabled
      } = message;

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            filterEngine.enabled,
            category
          )
      ) {
        filterEngine.enabled[
          category
        ] = Boolean(enabled);

        return {
          success: true,

          settings: {
            ...filterEngine.enabled
          }
        };
      }

      return {
        success: false
      };
    }

    return undefined;
  }
);

async function updateCookiesForTab(
  tabId
) {
  const report =
    getReport(tabId);

  if (!report.pageUrl) {
    return;
  }

  try {
    const cookies =
      await browser.cookies.getAll({
        url: report.pageUrl
      });

    let firstParty = 0;
    let thirdParty = 0;
    let session = 0;
    let persistent = 0;

    const pageHost =
      getHostnameFromUrl(
        report.pageUrl
      );

    for (
      const cookie of cookies
    ) {
      const cookieDomain =
        normalizeHostname(
          cookie.domain.replace(
            /^\./,
            ""
          )
        );

      const isThird =
        getBaseDomain(
          cookieDomain
        ) !==
        getBaseDomain(
          pageHost
        );

      if (isThird) {
        thirdParty++;
      } else {
        firstParty++;
      }

      if (
        cookie.session
      ) {
        session++;
      } else {
        persistent++;
      }
    }

    report.cookies = {
      firstParty,
      thirdParty,
      session,
      persistent
    };

    report.score =
      calculateScore(
        report
      );
  } catch (error) {
    console.error(
      "Privacy Inspector: error reading cookies",
      error
    );
  }
}