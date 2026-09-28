(() => {
  // Events are advisory: a page can forge or suppress them.
  const dispatch = window.dispatchEvent.bind(window);
  const EventClass = CustomEvent;
  const stringify = JSON.stringify;
  const apply = Reflect.apply;
  function notify(type, data) {
    try { dispatch(new EventClass("privacy-inspector-" + type, { detail: stringify(data) })); }
    catch { /* Instrumentation must not change the observed API's behavior. */ }
  }
  for (const [prototype, method] of [
    [HTMLCanvasElement.prototype, "toDataURL"],
    [HTMLCanvasElement.prototype, "toBlob"],
    [CanvasRenderingContext2D.prototype, "getImageData"]
  ]) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
      const original = descriptor.value;
      Object.defineProperty(prototype, method, { ...descriptor, value: function (...args) {
        const result = apply(original, this, args);
        const canvas = this.canvas || this;
        notify("canvas", { method, width: canvas.width, height: canvas.height, timestamp: Date.now() });
        return result;
      } });
    } catch { /* Non-writable APIs cannot be instrumented. */ }
  }

  // Baseline is captured AFTER our own wrappers; canvas wrappers are not accused.
  const targets = [
    [window, "fetch"], [window, "XMLHttpRequest"], [window, "WebSocket"],
    [XMLHttpRequest.prototype, "open"], [XMLHttpRequest.prototype, "send"],
    [HTMLCanvasElement.prototype, "toDataURL"], [HTMLCanvasElement.prototype, "toBlob"],
    [CanvasRenderingContext2D.prototype, "getImageData"]
  ].map(([object, key]) => ({ object, key, reference: object[key] }));
  let count = 0;
  function inspectHooks() {
    for (const target of targets) {
      try {
        if (target.object[target.key] !== target.reference) {
          target.reference = target.object[target.key];
          if (count++ < 100) notify("hook", { api: target.key, timestamp: Date.now(), indicator: "possible reference replacement" });
        }
      } catch { /* A page can install a throwing getter. */ }
    }
  }
  setInterval(() => { if (!document.hidden) inspectHooks(); }, 3000);
  window.addEventListener("pageshow", inspectHooks);
})();
