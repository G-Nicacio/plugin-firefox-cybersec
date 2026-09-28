const trackingDetector = {
  suspiciousParameterNames: new Set([
    "uid",
    "user_id",
    "userid",
    "user",
    "visitor",
    "visitor_id",
    "visitorid",
    "cid",
    "client_id",
    "clientid",
    "device_id",
    "deviceid",
    "session_id",
    "sessionid",
    "tracking_id",
    "trackingid",
    "click_id",
    "clickid",
    "gclid",
    "fbclid",
    "msclkid",
    "_ga",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "fb_source",
    "id"
  ]),

  getQueryParameters(url) {
    try {
      const parsed = new URL(url);

      const parameters = [];

      for (const [name, value] of parsed.searchParams.entries()) {
        parameters.push({
          name: name.toLowerCase(),
          value
        });
      }

      return parameters;
    } catch {
      return [];
    }
  },

  getSuspiciousParameters(url) {
    const parameters =
      this.getQueryParameters(url);

    return parameters.filter(
      (parameter) =>
        parameter.value.length > 0 && this.suspiciousParameterNames.has(
          parameter.name
        )
    );
  },

  getPotentialIdentifierValues(url) {
    return this
      .getSuspiciousParameters(url)
      // Short IDs are meaningful under explicit identifier names (uid=63).
      // A generic id needs stronger shape evidence to avoid product/page IDs.
      .filter(({ name, value }) => !name.startsWith("utm_") && name !== "fb_source" &&
        (name !== "id" || (value.length >= 8 && /[a-z]/i.test(value) && /[0-9]/.test(value))))
      .map(parameter => parameter.value);
  },

  findSharedIdentifiers(
    sourceUrl,
    destinationUrl
  ) {
    const sourceValues =
      new Set(
        this.getPotentialIdentifierValues(
          sourceUrl
        )
      );

    const destinationValues =
      this.getSuspiciousParameters(destinationUrl)
        .filter(parameter => !parameter.name.startsWith("utm_") && parameter.name !== "fb_source")
        .map(parameter => parameter.value);

    return destinationValues.filter(
      (value) =>
        sourceValues.has(value)
    );
  },

  analyzeRedirect(details) {
    const sourceHost =
      getHostnameFromUrl(
        details.url
      );

    const destinationHost =
      getHostnameFromUrl(
        details.redirectUrl
      );

    const sourceDomain =
      getBaseDomain(
        sourceHost
      );

    const destinationDomain =
      getBaseDomain(
        destinationHost
      );

    const crossSite =
      Boolean(
        sourceDomain &&
        destinationDomain &&
        sourceDomain !==
          destinationDomain
      );

    const suspiciousSourceParameters =
      this.getSuspiciousParameters(
        details.url
      );

    const suspiciousDestinationParameters =
      this.getSuspiciousParameters(
        details.redirectUrl
      );

    const sharedIdentifiers =
      this.findSharedIdentifiers(
        details.url,
        details.redirectUrl
      );

    return {
      requestId: details.requestId,
      sourceUrl:
        details.url,

      destinationUrl:
        details.redirectUrl,

      sourceDomain,

      destinationDomain,

      type:
        details.type,

      timestamp:
        details.timeStamp,

      crossSite,

      suspiciousSourceParameters,

      suspiciousDestinationParameters,

      sharedIdentifiers
    };
  }
};
