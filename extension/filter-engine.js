const filterEngine = {
  ads: new Set(), trackers: new Set(), custom: new Set(),
  enabled: { ads: true, trackers: true, custom: true },
  ignoredRules: 0, errors: [],
  normalizeDomain(value) {
    if (typeof value !== "string") return "";
    const domain = value.trim().toLowerCase().replace(/\.$/, "");
    if (domain.length > 253 || !domain.includes(".")) return "";
    return domain.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ? domain : "";
  },
  async loadFilterFile(path, targetSet) {
    try {
      const response = await fetch(browser.runtime.getURL(path));
      if (!response.ok) throw new Error("HTTP " + response.status);
      for (const line of (await response.text()).split(/\r?\n/)) {
        const rule = line.trim();
        if (!rule || rule.startsWith("#") || rule.startsWith("!")) continue;
        const domain = this.normalizeDomain(rule.replace(/^\|\|([^|^]+)\^$/, "$1"));
        if (domain) targetSet.add(domain);
        else this.ignoredRules++;
      }
    } catch (error) { this.errors.push(path + ": " + error.message); }
  },
  async loadBuiltInFilters() {
    this.ads.clear(); this.trackers.clear();
    await Promise.all([
      this.loadFilterFile("filters/ads.txt", this.ads),
      this.loadFilterFile("filters/trackers.txt", this.trackers)
    ]);
  },
  async loadCustomFilters() {
    const saved = await browser.storage.local.get(["customBlocklist", "filterSettings"]);
    this.custom = new Set((Array.isArray(saved.customBlocklist) ? saved.customBlocklist : [])
      .map(value => this.normalizeDomain(value)).filter(Boolean));
    for (const key of Object.keys(this.enabled)) {
      if (typeof saved.filterSettings?.[key] === "boolean") this.enabled[key] = saved.filterSettings[key];
    }
  },
  async saveCustomFilters() {
    await browser.storage.local.set({ customBlocklist: [...this.custom] });
  },
  async saveSettings() {
    await browser.storage.local.set({ filterSettings: { ...this.enabled } });
  },
  domainMatches(hostname, domain) {
    return hostname === domain || hostname.endsWith("." + domain);
  },
  matchesSet(hostname, set) {
    const labels = hostname.split(".");
    for (let index = 0; index < labels.length; index++) {
      const candidate = labels.slice(index).join(".");
      if (set.has(candidate)) return candidate;
    }
    return null;
  },
  classify(url) {
    const hostname = getHostnameFromUrl(url);
    const matches = [];
    for (const [key, category] of [["custom", "custom"], ["ads", "ad"], ["trackers", "tracker"]]) {
      const rule = this.matchesSet(hostname, this[key]);
      if (rule) matches.push({ key, category, rule });
    }
    const selected = matches.find(match => this.enabled[match.key]);
    const detected = selected || matches[0];
    return { blocked: Boolean(selected), category: detected?.category || null, rule: detected?.rule || null, matches };
  }
};
