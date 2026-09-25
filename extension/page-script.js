(() => {
  function notifyCanvas(method) {
    window.dispatchEvent(
      new CustomEvent("privacy-inspector-canvas", {
        detail: {
          method
        }
      })
    );
  }

  const originalToDataURL =
    HTMLCanvasElement.prototype.toDataURL;

  HTMLCanvasElement.prototype.toDataURL = function (...args) {
    notifyCanvas("HTMLCanvasElement.toDataURL");

    return originalToDataURL.apply(this, args);
  };

  const originalToBlob =
    HTMLCanvasElement.prototype.toBlob;

  HTMLCanvasElement.prototype.toBlob = function (...args) {
    notifyCanvas("HTMLCanvasElement.toBlob");

    return originalToBlob.apply(this, args);
  };

  const originalGetImageData =
    CanvasRenderingContext2D.prototype.getImageData;

  CanvasRenderingContext2D.prototype.getImageData =
    function (...args) {
      notifyCanvas(
        "CanvasRenderingContext2D.getImageData"
      );

      return originalGetImageData.apply(this, args);
    };
})();