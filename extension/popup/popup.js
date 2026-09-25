function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function renderThirdParties(report) {
  const list =
    document.getElementById("third-party-list");

  list.innerHTML = "";

  const domains =
    Object.entries(report.thirdPartyDomains);

  setText(
    "third-party-count",
    domains.length
  );

  for (const [domain, info] of domains) {
    const item = document.createElement("li");

    item.textContent =
      `${domain} (${info.count} requests)`;

    list.appendChild(item);
  }
}

function renderReport(report) {
  setText(
    "current-site",
    report.pageUrl || "Página desconhecida"
  );

  setText(
    "score",
    `${report.score}/100`
  );

  renderThirdParties(report);

  setText(
    "cookies-first-party",
    report.cookies.firstParty
  );

  setText(
    "cookies-third-party",
    report.cookies.thirdParty
  );

  setText(
    "cookies-session",
    report.cookies.session
  );

  setText(
    "cookies-persistent",
    report.cookies.persistent
  );

  setText(
    "local-storage",
    report.storage.localStorage
      ? `Sim (${report.storage.localStorageEntries})`
      : "Não"
  );

  setText(
    "session-storage",
    report.storage.sessionStorage
      ? `Sim (${report.storage.sessionStorageEntries})`
      : "Não"
  );

  setText(
    "indexed-db",
    report.storage.indexedDB
      ? `Sim (${report.storage.indexedDBDatabases.length})`
      : "Não"
  );

  setText(
    "canvas",
    report.canvas.detected
      ? "Detectado"
      : "Não detectado"
  );

  setText(
    "hijacking",
    report.hijacking.suspected
      ? "Possível indicador"
      : "Não detectado"
  );
}

async function loadReport() {
  const tabs = await browser.tabs.query({
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

loadReport();