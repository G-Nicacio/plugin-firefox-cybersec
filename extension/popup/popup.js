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
      `${domain} (${info.count} requests)`;

    list.appendChild(item);
  }
}

function renderReport(report) {
  setText(
    "current-site",
    report.pageUrl ||
      "Página desconhecida"
  );

  setText(
    "score",
    `${report.score}/100`
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
      ? "Detectado"
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
    report.blocked?.ads?.length || 0
  );

  setText(
    "trackers-blocked",
    report.blocked?.trackers?.length || 0
  );

  setText(
    "custom-blocked",
    report.blocked?.custom?.length || 0
  );
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

  list.innerHTML = "";

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
  }
}

async function loadFilterSettings() {
  const settings =
    await browser.runtime.sendMessage({
      type: "GET_FILTER_SETTINGS"
    });

  document.getElementById(
    "toggle-ads"
  ).checked =
    settings.ads;

  document.getElementById(
    "toggle-trackers"
  ).checked =
    settings.trackers;

  document.getElementById(
    "toggle-custom"
  ).checked =
    settings.custom;
}

function registerToggle(
  elementId,
  category
) {
  document
    .getElementById(elementId)
    .addEventListener(
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

document
  .getElementById(
    "add-block-domain"
  )
  .addEventListener(
    "click",
    addBlockDomain
  );

document
  .getElementById(
    "block-domain-input"
  )
  .addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter"
      ) {
        addBlockDomain();
      }
    }
  );

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

loadReport();
loadBlocklist();
loadFilterSettings();