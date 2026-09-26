const filterEngine = {
  ads: new Set(),
  trackers: new Set(),
  custom: new Set(),

  enabled: {
    ads: true,
    trackers: true,
    custom: true
  },

  normalizeDomain(domain) {
    if (!domain) {
      return "";
    }

    return domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^\|\|/, "")
      .replace(/\^$/, "")
      .replace(/^www\./, "")
      .split("/")[0];
  },

  async loadFilterFile(path, targetSet) {
    try {
      const url = browser.runtime.getURL(path);

      const response = await fetch(url);

      const text = await response.text();

      const lines = text.split(/\r?\n/);

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          continue;
        }

        if (
          trimmed.startsWith("#") ||
          trimmed.startsWith("!")
        ) {
          continue;
        }

        const domain =
          this.normalizeDomain(trimmed);

        if (domain) {
          targetSet.add(domain);
        }
      }
    } catch (error) {
      console.error(
        `Privacy Inspector: failed to load ${path}`,
        error
      );
    }
  },

  async loadBuiltInFilters() {
    this.ads.clear();
    this.trackers.clear();

    await Promise.all([
      this.loadFilterFile(
        "filters/ads.txt",
        this.ads
      ),

      this.loadFilterFile(
        "filters/trackers.txt",
        this.trackers
      )
    ]);

    console.log(
      "Privacy Inspector filters loaded:",
      {
        ads: this.ads.size,
        trackers: this.trackers.size
      }
    );
  },

  async loadCustomFilters() {
    const result =
      await browser.storage.local.get(
        "customBlocklist"
      );

    const saved =
      result.customBlocklist || [];

    this.custom =
      new Set(
        saved
          .map((domain) =>
            this.normalizeDomain(domain)
          )
          .filter(Boolean)
      );
  },

  async saveCustomFilters() {
    await browser.storage.local.set({
      customBlocklist:
        Array.from(this.custom)
    });
  },

  domainMatches(
    hostname,
    blockedDomain
  ) {
    return (
      hostname === blockedDomain ||
      hostname.endsWith(
        "." + blockedDomain
      )
    );
  },

  matchesSet(hostname, set) {
    for (const domain of set) {
      if (
        this.domainMatches(
          hostname,
          domain
        )
      ) {
        return domain;
      }
    }

    return null;
  },

  classify(url) {
    let hostname;

    try {
      hostname =
        new URL(url)
          .hostname
          .toLowerCase()
          .replace(/^www\./, "");
    } catch {
      return null;
    }

    if (this.enabled.custom) {
      const rule =
        this.matchesSet(
          hostname,
          this.custom
        );

      if (rule) {
        return {
          blocked: true,
          category: "custom",
          rule
        };
      }
    }

    if (this.enabled.ads) {
      const rule =
        this.matchesSet(
          hostname,
          this.ads
        );

      if (rule) {
        return {
          blocked: true,
          category: "ad",
          rule
        };
      }
    }

    if (this.enabled.trackers) {
      const rule =
        this.matchesSet(
          hostname,
          this.trackers
        );

      if (rule) {
        return {
          blocked: true,
          category: "tracker",
          rule
        };
      }
    }

    return {
      blocked: false,
      category: null,
      rule: null
    };
  }
};