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
        this.suspiciousParameterNames.has(
          parameter.name
        )
    );
  },

  getPotentialIdentifierValues(url) {
    return this
      .getQueryParameters(url)
      .map((parameter) =>
        parameter.value
      )
      .filter((value) => {
        if (!value) {
          return false;
        }

        /*
         * IDs muito pequenos gerariam
         * falsos positivos demais.
         */
        return value.length >= 6;
      });
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
      this.getPotentialIdentifierValues(
        destinationUrl
      );

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