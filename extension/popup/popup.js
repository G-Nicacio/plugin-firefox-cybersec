let latestReport = null;
function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function renderThirdParties(report) {
  const list =
    document.getElementById("third-party-list");

  if (!list) {
    return;
  }

  list.replaceChildren();

  const domains =
    Object.entries(
      report.thirdPartyDomains || {}
    );

  setText(
    "third-party-count",
    domains.length
  );

  for (const [domain, info] of domains) {
    const item =
      document.createElement("li");

    item.textContent =
      `${domain}: ${info.count} tentativas, ${info.blocked || 0} bloqueadas`;

    list.appendChild(item);
  }
}

function renderTrackingIndicators(report) {
  const list =
    document.getElementById(
      "tracking-indicators"
    );

  if (!list) {
    return;
  }

  list.replaceChildren();

  const indicators =
    report
      .bounceTracking
      ?.indicators || [];

  for (const indicator of indicators) {
    const item =
      document.createElement("li");

    item.textContent =
      indicator;

    list.appendChild(item);
  }
}

function renderReport(report) {
  if (!report) { setText("status", "Relatório indisponível. Recarregue a página."); return; }
  latestReport = report;
  setText("cookie-status", report.cookies?.errors ? "Consulta parcial: alguns cookies ficaram indisponíveis." : "Partições filtradas pelo site principal.");
  setText("storage-status", report.storage?.unavailable?.length ? "APIs indisponíveis: " + report.storage.unavailable.join(", ") : "Metadados dos frames observados.");
  setText("detected-counts", `Tentativas classificadas: ads ${report.detectedCounts?.ads || 0}, trackers ${report.detectedCounts?.trackers || 0}, custom ${report.detectedCounts?.custom || 0}.`);
  const security = document.getElementById("security-indicators");
  security.replaceChildren();
  for (const text of [...(report.hijacking?.indicators || []), ...(report.hijacking?.hooks || []).map(hook => "API alterada: " + hook.api)]) {
    const item = document.createElement("li"); item.textContent = text; security.appendChild(item);
  }
  const breakdown = document.getElementById("score-breakdown");
  breakdown.replaceChildren();
  for (const [key, value] of Object.entries(report.scoreBreakdown || {})) {
    const item = document.createElement("li"); item.textContent = `${key}: −${value}`; breakdown.appendChild(item);
  }
  setText("status", report.filterStatus?.errors?.length ? "Falha ao carregar filtros: " + report.filterStatus.errors.join("; ") : "Histórico limitado às 200 amostras mais recentes; contadores de requests são cumulativos.");
  setText(
    "current-site",
    report.pageUrl ||
      "Página desconhecida"
  );

  setText(
    "score",
    report.navigationObserved === false ? "--" : `${report.score}/100`
  );

  renderThirdParties(report);

  setText(
    "cookies-first-party",
    report.cookies?.firstParty || 0
  );

  setText(
    "cookies-third-party",
    report.cookies?.thirdParty || 0
  );

  setText(
    "cookies-session",
    report.cookies?.session || 0
  );

  setText(
    "cookies-persistent",
    report.cookies?.persistent || 0
  );

  setText(
    "local-storage",
    report.storage?.localStorage
      ? `Sim (${report.storage.localStorageEntries})`
      : "Não"
  );

  setText(
    "session-storage",
    report.storage?.sessionStorage
      ? `Sim (${report.storage.sessionStorageEntries})`
      : "Não"
  );

  setText(
    "indexed-db",
    report.storage?.indexedDB
      ? `Sim (${report.storage.indexedDBDatabases.length})`
      : "Não"
  );

  setText(
    "canvas",
    report.canvas?.detected
      ? "Possível readout"
      : "Não detectado"
  );

  setText(
    "hijacking",
    report.hijacking?.suspected
      ? "Possível indicador"
      : "Não detectado"
  );

  setText(
    "ads-blocked",
    report.blockedCounts?.ads ?? report.blocked?.ads?.length ?? 0
  );

  setText(
    "trackers-blocked",
    report.blockedCounts?.trackers ?? report.blocked?.trackers?.length ?? 0
  );

  setText(
    "custom-blocked",
    report.blockedCounts?.custom ?? report.blocked?.custom?.length ?? 0
  );

  setText(
    "bounce-tracking",
    report
      .bounceTracking
      ?.suspected
      ? "Possível"
      : "Não detectado"
  );

  setText(
    "cookie-sync",
    report
      .bounceTracking
      ?.cookieSyncSuspected
      ? "Possível"
      : "Não detectado"
  );

  setText(
    "redirect-count",
    report
      .bounceTracking
      ?.redirects
      ?.length || 0
  );

  setText(
    "tracking-param-count",
    report
      .bounceTracking
      ?.suspiciousParameters
      ?.length || 0
  );

  setText(
    "shared-id-count",
    report
      .bounceTracking
      ?.sharedIdentifiers
      ?.length || 0
  );

  renderTrackingIndicators(report);
  if (report.navigationObserved === false) setText("status", "Observação parcial: recarregue a página para iniciar uma navegação monitorada.");
}

async function loadReport() {
  const tabs =
    await browser.tabs.query({
      active: true,
      currentWindow: true
    });

  const tab = tabs[0];

  if (!tab) {
    return;
  }

  const report =
    await browser.runtime.sendMessage({
      type: "GET_REPORT",
      tabId: tab.id
    });

  renderReport(report);
}

async function loadBlocklist() {
  const result =
    await browser.runtime.sendMessage({
      type: "GET_BLOCKLIST"
    });

  renderBlocklist(
    result.domains || []
  );
}

function renderBlocklist(domains) {
  const list =
    document.getElementById(
      "blocklist"
    );

  if (!list) {
    return;
  }

  list.replaceChildren();

  for (const domain of domains) {
    const item =
      document.createElement("li");

    const text =
      document.createElement("span");

    text.textContent = domain;

    const removeButton =
      document.createElement("button");

    removeButton.textContent =
      "Remove";

    removeButton.className =
      "blocklist-remove";

    removeButton.addEventListener(
      "click",
      async () => {
        const result =
          await browser.runtime.sendMessage({
            type:
              "REMOVE_BLOCK_DOMAIN",
            domain
          });

        renderBlocklist(
          result.domains || []
        );
      }
    );

    item.appendChild(text);
    item.appendChild(
      removeButton
    );

    list.appendChild(item);
  }
}

async function addBlockDomain() {
  const input =
    document.getElementById(
      "block-domain-input"
    );

  if (!input) {
    return;
  }

  const domain =
    input.value.trim();

  if (!domain) {
    return;
  }

  const result =
    await browser.runtime.sendMessage({
      type: "ADD_BLOCK_DOMAIN",
      domain
    });

  if (result.success) {
    input.value = "";

    renderBlocklist(
      result.domains || []
    );
  } else {
    setText("status", result.error || "Não foi possível salvar o domínio.");
  }
}

async function loadFilterSettings() {
  const settings =
    await browser.runtime.sendMessage({
      type: "GET_FILTER_SETTINGS"
    });

  const adsToggle =
    document.getElementById(
      "toggle-ads"
    );

  const trackersToggle =
    document.getElementById(
      "toggle-trackers"
    );

  const customToggle =
    document.getElementById(
      "toggle-custom"
    );

  if (adsToggle) {
    adsToggle.checked =
      settings.ads;
  }

  if (trackersToggle) {
    trackersToggle.checked =
      settings.trackers;
  }

  if (customToggle) {
    customToggle.checked =
      settings.custom;
  }
}

function registerToggle(
  elementId,
  category
) {
  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  element.addEventListener(
    "change",
    async (event) => {
      await browser.runtime.sendMessage({
        type:
          "SET_FILTER_SETTING",

        category,

        enabled:
          event.target.checked
      });
    }
  );
}

const addButton =
  document.getElementById(
    "add-block-domain"
  );

if (addButton) {
  addButton.addEventListener(
    "click",
    () => addBlockDomain().catch(showError)
  );
}

const blockInput =
  document.getElementById(
    "block-domain-input"
  );

if (blockInput) {
  blockInput.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter"
      ) {
        addBlockDomain().catch(showError);
      }
    }
  );
}

registerToggle(
  "toggle-ads",
  "ads"
);

registerToggle(
  "toggle-trackers",
  "trackers"
);

registerToggle(
  "toggle-custom",
  "custom"
);

function showError(error) { setText("status", "Falha: " + error.message); }
document.getElementById("refresh-report").addEventListener("click", () => loadReport().catch(showError));
document.getElementById("export-report").addEventListener("click", () => {
  if (!latestReport) return;
  const payload = { exportedAt: new Date().toISOString(), version: browser.runtime.getManifest().version, report: latestReport };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = "privacy-inspector-report.json"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
Promise.all([loadReport(), loadBlocklist(), loadFilterSettings()]).catch(showError);
