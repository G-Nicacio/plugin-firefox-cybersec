const http = require("node:http");
const page = '<!doctype html><meta charset="utf-8"><title>Privacy Inspector controlled fixture</title><h1>Controlled privacy fixture</h1><p>Storage, canvas, third-party polling, WebSocket and delayed fetch hook.</p><canvas id="test" width="120" height="40"></canvas><pre id="result"></pre><script src="/fixture.js"></script>';
const script = String.raw`
localStorage.setItem("fixture", "metadata-test");
sessionStorage.setItem("fixture", "metadata-test");
indexedDB.open("privacy-inspector-fixture", 1);
document.cookie = "fixture_session=1; SameSite=Lax";
const canvas = document.getElementById("test");
canvas.getContext("2d").fillText("privacy test", 5, 20);
const data = canvas.toDataURL();
canvas.toBlob(blob => document.getElementById("result").textContent = "Canvas original behavior: " + Boolean(blob) + ", " + data.startsWith("data:image/png"));
setInterval(() => fetch("http://127.0.0.1:8765/poll").catch(() => {}), 2000);
new WebSocket("ws://127.0.0.1:8765/socket");
setTimeout(() => { const original = window.fetch; window.fetch = function(...args) { return original.apply(this,args); }; }, 1000);
`;
http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/fixture.js") { res.setHeader("Content-Type", "application/javascript"); res.end(script); }
  else if (req.url === "/poll") { res.setHeader("Content-Type", "application/json"); res.end('{"ok":true}'); }
  else { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(page); }
}).listen(8765, "127.0.0.1", () => console.log("Fixture: http://localhost:8765"));
