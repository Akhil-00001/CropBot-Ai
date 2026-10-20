// Where the backend API lives.
// Local development uses the backend's `npm start` (port 3001).
// After deploying the backend, put its URL in PRODUCTION_API_URL.
(function () {
  var PRODUCTION_API_URL = "https://crop-bot-ai.vercel.app";
  var isLocal = ["localhost", "127.0.0.1"].indexOf(location.hostname) !== -1;
  window.CROPBOT_API_URL = isLocal ? "http://localhost:3001" : PRODUCTION_API_URL;
})();
