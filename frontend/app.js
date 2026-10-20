// CropBot chat client: collects the field profile, sends the conversation to
// the backend and renders the streamed reply.
(() => {
  // Always open at the top of the page. Without this the browser restores the
  // old scroll position on refresh, and a URL ending in "#ask" jumps to the chat.
  // (window.history, because "history" below is the chat conversation.)
  window.history.scrollRestoration = "manual";
  if (location.hash) window.history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "instant" });

  // In-page links (#ask, #support, ...) scroll smoothly without putting the
  // "#..." into the URL, so a later refresh still starts at the top.
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href").slice(1);
    const target = id === "top" ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const API = window.CROPBOT_API_URL;
  const STORAGE_KEY = "cropbot-profile";

  const $ = (id) => document.getElementById(id);
  const form = $("profile-form");
  const log = $("chat-log");
  const chips = $("chips");
  const composer = $("composer");
  const input = $("question");
  const sendBtn = $("send");
  const langButtons = form.querySelectorAll("[data-lang]");

  const EXAMPLES = {
    English: [
      "What can I sow this season?",
      "My crop leaves are turning yellow. What should I do?",
      "Which crops suit rain-fed land in my area?",
      "How can I protect my crop from monkeys and wild boar?",
    ],
    Hindi: [
      "इस मौसम में मैं क्या बोऊँ?",
      "मेरी फसल की पत्तियाँ पीली हो रही हैं, क्या करूँ?",
      "मेरे इलाके में बिना सिंचाई वाली ज़मीन पर कौन सी फसल ठीक रहेगी?",
      "बंदर और जंगली सूअर से फसल कैसे बचाऊँ?",
    ],
  };

  let language = "English";
  let history = []; // [{ role: "user" | "assistant", content: string }]
  let busy = false;

  // ---------- profile ----------

  function getProfile() {
    return {
      district: $("district").value,
      altitude: $("altitude").value,
      irrigation: $("irrigation").value,
      crop: $("crop").value.trim(),
      language,
    };
  }

  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(getProfile())); } catch { /* storage unavailable */ }
  }

  function loadProfile() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { saved = null; }
    if (!saved) return;
    for (const key of ["district", "altitude", "irrigation", "crop"]) {
      if (saved[key] !== undefined) $(key).value = saved[key];
    }
    if (saved.language) setLanguage(saved.language);
  }

  function setLanguage(lang) {
    language = EXAMPLES[lang] ? lang : "English";
    langButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === language)));
    input.placeholder = language === "Hindi"
      ? "बुवाई, बीमार फसल, कीड़े... के बारे में पूछें"
      : "Ask about sowing, a sick crop, pests...";
    renderChips();
  }

  function renderChips() {
    chips.replaceChildren(...EXAMPLES[language].map((text) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.disabled = busy;
      b.addEventListener("click", () => ask(text));
      return b;
    }));
  }

  // ---------- rendering ----------

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function inline(s) {
    return escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  }

  // Minimal, safe Markdown: headings, bold, italics, bullet and numbered lists.
  // HTML from the model is always escaped first.
  function renderMarkdown(text) {
    const out = [];
    let list = null; // "ul" | "ol"
    const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

    for (const raw of text.split("\n")) {
      const line = raw.trimEnd();
      let m;
      if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) {
        if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
        out.push(`<li>${inline(m[1])}</li>`);
      } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
        out.push(`<li>${inline(m[1])}</li>`);
      } else if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
        closeList();
        out.push(`<h4>${inline(m[1])}</h4>`);
      } else if (line.trim() === "" || /^-{3,}$/.test(line.trim())) {
        closeList();
      } else {
        closeList();
        out.push(`<p>${inline(line)}</p>`);
      }
    }
    closeList();
    return out.join("");
  }

  function addMessage(role, text) {
    $("welcome")?.remove();
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    if (role === "bot") el.innerHTML = renderMarkdown(text);
    else el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function setBusy(value) {
    busy = value;
    sendBtn.disabled = value;
    chips.querySelectorAll("button").forEach((b) => { b.disabled = value; });
  }

  // ---------- talking to the backend ----------

  async function ask(question) {
    question = question.trim();
    if (!question || busy) return;

    const profile = getProfile();
    if (!profile.district) {
      addMessage("error", language === "Hindi" ? "कृपया पहले अपना ज़िला चुनें।" : "Please choose your district first.");
      $("district").focus();
      return;
    }

    addMessage("user", question);
    history.push({ role: "user", content: question });
    input.value = "";
    autoGrow();
    setBusy(true);

    const bubble = addMessage("bot", "");
    bubble.innerHTML = '<span class="typing" aria-label="CropBot is typing"><span></span><span></span><span></span></span>';

    let answer = "";
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, messages: history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        bubble.innerHTML = renderMarkdown(answer);
        log.scrollTop = log.scrollHeight;
      }
      answer += decoder.decode();
      if (!answer.trim()) throw new Error("Empty reply from the server.");
      bubble.innerHTML = renderMarkdown(answer);
      history.push({ role: "assistant", content: answer });
      setStatus(true);
    } catch (err) {
      bubble.remove();
      // Drop the unanswered question so the next request stays user/assistant alternating.
      history.pop();
      const offline = err instanceof TypeError; // fetch network failure
      if (offline) setStatus(false);
      addMessage("error", offline
        ? "Could not reach the CropBot server. Check that the backend is running and the API URL in config.js is right."
        : err.message);
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  function setStatus(online) {
    $("status-dot").classList.toggle("offline", !online);
    $("status-text").textContent = online ? "Field advisory active" : "Server offline";
  }

  async function checkHealth() {
    try {
      const res = await fetch(`${API}/api/health`);
      const data = await res.json();
      setStatus(Boolean(data.ok));
    } catch {
      setStatus(false);
    }
  }

  function autoGrow() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }

  // ---------- events ----------

  composer.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input.value);
    }
  });
  input.addEventListener("input", autoGrow);

  form.addEventListener("change", saveProfile);
  langButtons.forEach((b) => b.addEventListener("click", () => { setLanguage(b.dataset.lang); saveProfile(); }));

  $("new-chat").addEventListener("click", () => {
    if (busy) return;
    history = [];
    log.innerHTML = `<div class="welcome" id="welcome"><h3>Namaste! I am CropBot.</h3>
      <p>Choose your district, then ask a question or tap one below.</p></div>`;
  });

  setLanguage(language);
  loadProfile();
  checkHealth();
})();
