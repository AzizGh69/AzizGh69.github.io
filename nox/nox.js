/* NOX — the recruiter agent. An original character; the look borrows only the site's own
   midnight-blue, moon and slanted-menu mood. Talks to /api/chat (functions/api/chat.js).
   Relies on the page's globals: lang, go, show, current, QUESTS, CERTS, SKILLS, LOG, renderTabs, renderList, renderDetail, pickCert. */
(() => {
  const API = "/api/chat";
  const TAG_KEY = "nox-tag-seen", VOICE_KEY = "nox-voice";

  const T = {
    en: {
      title: "Recruiter liaison", ring: "ASK NOX · RECRUITER MODE · ASK NOX · RECRUITER MODE · ",
      open: "Ask NOX, the recruiter assistant", tag: "Hiring? I'll tell you why Aziz fits.", tagClose: "Dismiss",
      chat: "Chat", match: "Job match", full: "Full view", close: "Close", voiceOn: "Voice: on", voiceOff: "Voice: off", noVoice: "No voice for this language in your browser",
      mic: "Speak your question", micOn: "Listening… click to stop", send: "Send", placeholder: "Ask about Aziz's skills, projects…",
      hello: "I'm **NOX**. I represent Aziz. Ask me anything about his work, or paste a job description in **Job match** and I'll tell you how well he fits, with proof.",
      choices: ["Why should I hire Aziz?", "What data engineering has he shipped?", "Tell me about Kalori", "When is he available?"],
      toMatch: "Check a job match →",
      jdLabel: "Paste the job description", jdPh: "Paste the full job post here (title, responsibilities, requirements)…", analyze: "Analyse the match",
      thinking: "NOX is thinking…", direct: "Direct", adjacent: "Adjacent", gap: "Gap", must: "Must", nice: "Nice",
      scoreLbl: "Match", reqs: "Requirements", pitch: "Why Aziz",
      disc: "AI assistant · answers come only from this portfolio · confirm details with Aziz.",
      err: { rate_limited: "That's a lot of questions at once. Give me a minute and ask again.", busy: "My free AI quota is busy right now. Try again in a minute, or email Aziz: aziz19ghazouani@gmail.com.",
        not_configured: "I'm not switched on yet. Meanwhile, Aziz answers email: aziz19ghazouani@gmail.com.", jd_too_short: "That job description is too short. Paste the full post.",
        default: "I lost the connection for a second. Try again, or email Aziz: aziz19ghazouani@gmail.com." },
      facts: { profile: "Profile", education: "Education", languages: "Languages", certifications: "Certifications", awards: "Awards", availability: "Availability" }
    },
    fr: {
      title: "Agent recruteur", ring: "DEMANDEZ À NOX · MODE RECRUTEUR · DEMANDEZ À NOX · MODE RECRUTEUR · ",
      open: "Demander à NOX, l’assistant recruteur", tag: "Vous recrutez ? Je vous dis pourquoi Aziz correspond.", tagClose: "Fermer",
      chat: "Discussion", match: "Adéquation", full: "Plein écran", close: "Fermer", voiceOn: "Voix : activée", voiceOff: "Voix : coupée", noVoice: "Pas de voix pour cette langue dans votre navigateur",
      mic: "Poser votre question à voix haute", micOn: "J’écoute… cliquez pour arrêter", send: "Envoyer", placeholder: "Compétences, projets d’Aziz…",
      hello: "Je suis **NOX**. Je représente Aziz. Posez-moi vos questions sur son travail, ou collez une offre dans **Adéquation** : je vous dis à quel point il correspond, preuves à l’appui.",
      choices: ["Pourquoi recruter Aziz ?", "Qu’a-t-il livré en data engineering ?", "Parlez-moi de Kalori", "Quand est-il disponible ?"],
      toMatch: "Tester une offre →",
      jdLabel: "Collez l’offre d’emploi", jdPh: "Collez l’offre complète ici (intitulé, missions, profil recherché)…", analyze: "Analyser l’adéquation",
      thinking: "NOX réfléchit…", direct: "Direct", adjacent: "Proche", gap: "Manque", must: "Requis", nice: "Bonus",
      scoreLbl: "Adéquation", reqs: "Exigences", pitch: "Pourquoi Aziz",
      disc: "Assistant IA · réponses tirées uniquement de ce portfolio · à confirmer avec Aziz.",
      err: { rate_limited: "Beaucoup de questions d’un coup. Laissez-moi une minute.", busy: "Mon quota d’IA gratuit est saturé. Réessayez dans une minute, ou écrivez à Aziz : aziz19ghazouani@gmail.com.",
        not_configured: "Je ne suis pas encore branché. En attendant, Aziz répond par e-mail : aziz19ghazouani@gmail.com.", jd_too_short: "L’offre est trop courte. Collez le texte complet.",
        default: "J’ai perdu la connexion un instant. Réessayez, ou écrivez à Aziz : aziz19ghazouani@gmail.com." },
      facts: { profile: "Profil", education: "Formation", languages: "Langues", certifications: "Certifications", awards: "Distinctions", availability: "Disponibilité" }
    }
  };
  const L = () => (typeof lang !== "undefined" && lang === "fr" ? "fr" : "en");
  const tx = (k) => T[L()][k];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isCalm = () => document.documentElement.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slug = (s) => s.toLowerCase().replace(/#/g, "sharp").replace(/[+]/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ---------- the character (inline SVG, ids prefixed so it can appear twice) ---------- */
  function noxSVG(p, view, fit = "xMidYMid meet") {
    return `<svg class="nox-svg" viewBox="${view}" preserveAspectRatio="${fit}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs>
  <radialGradient id="${p}moon" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#D6F7FF"/><stop offset=".85" stop-color="#8FD9FF" stop-opacity=".55"/><stop offset="1" stop-color="#4FE6FF" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}hair" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#F2F8FF"/><stop offset=".45" stop-color="#A9C0F2"/><stop offset="1" stop-color="#4E69BE"/></linearGradient>
  <linearGradient id="${p}skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DCCB"/><stop offset="1" stop-color="#E4BBA3"/></linearGradient>
  <linearGradient id="${p}coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17389A"/><stop offset="1" stop-color="#060F33"/></linearGradient>
  <filter id="${p}glow" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g class="nox-moonbg"><circle cx="128" cy="70" r="64" fill="url(#${p}moon)"/><circle cx="146" cy="52" r="7" fill="#9BC9E8" opacity=".22"/><circle cx="112" cy="40" r="4" fill="#9BC9E8" opacity=".2"/><circle cx="156" cy="88" r="5" fill="#9BC9E8" opacity=".18"/></g>
<path d="M60 96C52 60 62 30 98 24C134 20 150 46 144 84C142 98 138 110 134 118L130 92H70L66 118C62 112 61 104 60 96Z" fill="#3F58A8"/>
<path d="M88 116H112L113 142Q100 152 87 142Z" fill="#D9AC90"/>
<path d="M14 230C18 186 42 160 78 150L100 170L122 150C158 160 182 186 186 230Z" fill="url(#${p}coat)"/>
<path d="M58 160L84 206M142 160L116 206" stroke="#4FE6FF" stroke-width="1.4" opacity=".55"/>
<path d="M84 150L100 186L116 150L108 146L100 160L92 146Z" fill="#EAF4FF"/>
<path d="M97 158H103L105 164L102 196L100 200L98 196L95 164Z" fill="#4FE6FF"/>
<path d="M78 150L86 124L98 160L92 176Z" fill="#1A3FA8" stroke="#4FE6FF" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M122 150L114 124L102 160L108 176Z" fill="#1A3FA8" stroke="#4FE6FF" stroke-width="1.2" stroke-linejoin="round"/>
<circle cx="66" cy="190" r="6" fill="#4FE6FF"/><circle cx="68.6" cy="188" r="5.4" fill="#0D2266"/>
<path d="M68 86C62 84 61 98 69 102Z" fill="#E4BBA3"/><path d="M132 86C138 84 139 98 131 102Z" fill="#E4BBA3"/>
<path d="M68 74C68 46 132 46 132 74L130 100C127 118 114 132 100 133C86 132 73 118 70 100Z" fill="url(#${p}skin)"/>
<ellipse cx="80" cy="108" rx="6" ry="3" fill="#F08A8A" opacity=".22"/><ellipse cx="120" cy="108" rx="6" ry="3" fill="#F08A8A" opacity=".22"/>
<path d="M78 77L95 75M105 75L122 76" stroke="#4E69BE" stroke-width="2.6" stroke-linecap="round"/>
<path d="M66 82L136 79L134 97L68 99Z" fill="#0A1E5A" fill-opacity=".62" stroke="#4FE6FF" stroke-width="1" stroke-linejoin="round"/>
<g class="nox-eyes" filter="url(#${p}glow)"><ellipse class="nox-eye" cx="87" cy="90" rx="7.5" ry="3.6" fill="#4FE6FF"/><ellipse class="nox-eye" cx="113" cy="89" rx="7.5" ry="3.6" fill="#4FE6FF"/></g>
<path d="M70 85L132 82" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>
<path d="M100 99L97.5 107L101 108" stroke="#C4927A" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<g class="nox-mouth">
  <path class="m0" d="M92 117Q100 121 108 115" stroke="#8A4A45" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path class="m1" d="M93 116Q100 114.5 107 116Q100 123 93 116Z" fill="#5A2430"/>
  <path class="m2" d="M92 115Q100 112.5 108 115Q101 128 92 115Z" fill="#5A2430"/>
</g>
<path d="M62 88C58 58 72 34 100 32C126 30 144 48 140 84L134 70L130 86L122 60L116 82L106 56L100 80L92 54L86 82L78 60L72 90L66 74Z" fill="url(#${p}hair)"/>
<path d="M64 78L58 118L70 100L72 84Z" fill="url(#${p}hair)"/>
<path d="M98 32C104 18 120 14 126 22C116 20 108 24 104 34Z" fill="#C9D8F8"/>
<path d="M80 44C92 36 112 36 124 44" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/>
<rect x="130" y="88" width="7" height="12" rx="3" fill="#0B1E57" stroke="#4FE6FF" stroke-width="1"/>
<circle class="nox-led" cx="133.5" cy="94" r="1.6" fill="#4FE6FF"/>
<path d="M134 100Q131 116 116 120" stroke="#0B1E57" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="116" cy="120" r="2" fill="#4FE6FF"/>
<g class="nox-card" transform="translate(138 156) rotate(12)">
  <rect width="38" height="58" rx="3" fill="#040A1C" stroke="#4FE6FF" stroke-width="1.4"/>
  <rect x="3" y="3" width="32" height="52" rx="2" fill="none" stroke="#FFC547" stroke-width=".7"/>
  <circle cx="19" cy="22" r="9" fill="#D6F7FF"/><circle cx="23" cy="19" r="8" fill="#040A1C"/>
  <path d="M8 34L30 34" stroke="#FFC547" stroke-width=".6"/>
  <text x="19" y="43" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-style="italic" font-size="6" fill="#fff">THE</text>
  <text x="19" y="50" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-style="italic" font-size="6" fill="#fff" letter-spacing=".2">CANDIDATE</text>
</g>
</svg>`;
  }

  /* ---------- DOM ---------- */
  const bubble = document.createElement("button");
  bubble.type = "button"; bubble.className = "nox-bubble"; bubble.id = "noxBubble";
  bubble.innerHTML = `<svg class="nox-ringtext" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="noxRingPath" d="M60 60m-50 0a50 50 0 1 1 100 0a50 50 0 1 1 -100 0"/></defs><text><textPath href="#noxRingPath" id="noxRingText"></textPath></text></svg>
    <span class="nox-moon">${noxSVG("b", "50 22 100 100")}</span><span class="nox-ping" aria-hidden="true"></span>`;

  const tag = document.createElement("div");
  tag.className = "nox-tag"; tag.hidden = true;
  tag.innerHTML = `<button type="button" class="nox-tag-text" data-nox-open></button><button type="button" class="nox-tag-x">×</button>`;

  const float = document.createElement("div");
  float.className = "nox-float"; float.hidden = true;

  const agent = document.createElement("div");
  agent.className = "nox"; agent.dataset.state = "idle";
  agent.setAttribute("role", "dialog"); agent.setAttribute("aria-labelledby", "noxName");
  agent.innerHTML = `
  <div class="nox-stage" aria-hidden="true">
    <div class="nox-slash"></div><div class="nox-slash s2"></div>
    <div class="nox-figure">${noxSVG("f", "0 0 200 230", "xMidYMax meet")}</div>
  </div>
  <div class="nox-main">
    <div class="nox-top">
      <div class="nox-plate"><b id="noxName">NOX</b><span data-x="title"></span></div>
      <div class="nox-tools">
        <button type="button" class="nox-tool" id="noxVoice" aria-pressed="false"><svg viewBox="0 0 32 24" aria-hidden="true"><path d="M3 8h6l8-6v20l-8-6H3z" fill="currentColor"/><path class="w" d="M21 8.5q2.5 3.5 0 7M24.5 4.5q5 7.5 0 15" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path class="x" d="M2 22L29 1" stroke="currentColor" stroke-width="2.6"/></svg></button>
        <button type="button" class="nox-tool" id="noxFull" data-go="recruiter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg></button>
        <button type="button" class="nox-tool" id="noxClose"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6"/></svg></button>
      </div>
    </div>
    <div class="nox-tabs" role="tablist">
      <button type="button" role="tab" class="nox-tab" data-view="chat" aria-selected="true" data-x="chat"></button>
      <button type="button" role="tab" class="nox-tab" data-view="match" aria-selected="false" data-x="match"></button>
    </div>
    <div class="nox-view" data-v="chat">
      <div class="nox-log" id="noxLog" aria-live="polite"></div>
      <div class="nox-choices" id="noxChoices"></div>
      <form class="nox-input" id="noxForm">
        <button type="button" class="nox-tool nox-mic" id="noxMic" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4" stroke="currentColor" stroke-width="2.2" fill="none"/></svg></button>
        <textarea id="noxText" rows="1" maxlength="1000"></textarea>
        <button type="submit" class="nox-send" id="noxSend"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20L21 12L3 4L6 12Z" fill="currentColor"/></svg></button>
      </form>
    </div>
    <div class="nox-view" data-v="match" hidden>
      <form class="nox-jd" id="noxJdForm">
        <label for="noxJd" data-x="jdLabel"></label>
        <textarea id="noxJd" maxlength="8000"></textarea>
        <button type="submit" class="nox-go" data-x="analyze"></button>
      </form>
      <div class="nox-result" id="noxResult" aria-live="polite"></div>
    </div>
    <p class="nox-disc" data-x="disc"></p>
  </div>`;
  float.appendChild(agent);
  document.body.append(float, tag, bubble);

  const $n = (s) => agent.querySelector(s);
  const log = $n("#noxLog"), text = $n("#noxText"), choicesEl = $n("#noxChoices");

  /* ---------- evidence chips: [quest:kalori] → a button that opens it on the site ---------- */
  function label(id) {
    const [kind, key] = id.split(":");
    if (kind === "quest") return QUESTS.find((q) => q.id === key)?.title;
    if (kind === "cert") return CERTS.find((c) => c.id === key)?.title;
    if (kind === "skill") { for (const g of SKILLS) for (const [n] of g.items) if (slug(n) === key) return n; return null; }
    if (kind === "log") return LOG.find((e) => slug(e.org.split("·")[0]) === key)?.org.split("·")[0].trim();
    if (kind === "fact") return T[L()].facts[key] || null;
    if (id === "cv") return "CV";
    return null;
  }
  const chip = (id) => { const l = label(id); return l ? `<button type="button" class="nox-ev" data-ev="${esc(id)}">${esc(l)}</button>` : ""; };
  // Text from the model is escaped first; only our own chips, **bold** and bullets are turned into markup.
  function rich(s) {
    let h = esc(s)
      .replace(/\[((?:quest|cert|skill|log|fact):[a-z0-9-]+|cv)\]/g, (_, id) => chip(id))
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\b(https:\/\/[^\s<]+|mailto:[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^mailto:|^https:\/\//, "")}</a>`)
      .replace(/\b([a-z0-9._-]+@gmail\.com)\b(?![^<]*<\/a>)/g, '<a href="mailto:$1">$1</a>');
    const lines = h.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let out = "", list = false;
    for (const l of lines) {
      if (/^[-•*] /.test(l)) { if (!list) { out += "<ul>"; list = true; } out += `<li>${l.slice(2)}</li>`; }
      else { if (list) { out += "</ul>"; list = false; } out += `<p>${l}</p>`; }
    }
    return out + (list ? "</ul>" : "");
  }
  const speakable = (s) => s.replace(/\[((?:quest|cert|skill|log|fact):[a-z0-9-]+|cv)\]/g, (_, id) => label(id) || "").replace(/\*\*/g, "").replace(/^[-•*] /gm, "").replace(/https?:\/\/\S+/g, "");
  function openEvidence(id) {
    const [kind, key] = id.split(":");
    if (id === "cv") { window.open("cv/Mohamed-Aziz-Ghazouani-CV.pdf", "_blank", "noopener"); return; }
    let to = "profile";
    if (kind === "quest") { tab = "all"; qsel = key; renderTabs(); renderList(); renderDetail(); to = "quests"; }
    else if (kind === "cert") { pickCert(key); to = "certs"; }
    else if (kind === "skill") to = "stats";
    else if (kind === "log") to = "log";
    if (current !== "recruiter") closePanel(false);
    go(to);
  }
  agent.addEventListener("click", (e) => { const b = e.target.closest("[data-ev]"); if (b) openEvidence(b.dataset.ev); });

  /* ---------- states and voice ---------- */
  const setState = (s) => { agent.dataset.state = s; bubble.dataset.state = s; };
  let voiceOn = false;
  try { voiceOn = localStorage.getItem(VOICE_KEY) === "1"; } catch {}
  const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
  const pickVoice = () => {
    if (!synth) return null;
    const want = L(), vs = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(want));
    const score = (v) => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google|microsoft/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1) + (/-(US|GB|FR)$/i.test(v.lang) ? 1 : 0);
    return vs.sort((a, b) => score(b) - score(a))[0] || null;
  };
  function paintVoice() {
    const b = $n("#noxVoice"), has = !!pickVoice();
    b.setAttribute("aria-pressed", String(voiceOn && has));
    b.setAttribute("aria-disabled", String(!has));
    b.title = !has ? tx("noVoice") : voiceOn ? tx("voiceOn") : tx("voiceOff");
    b.setAttribute("aria-label", b.title);
  }
  if (synth) synth.addEventListener?.("voiceschanged", paintVoice);
  let speaking = false;
  function speak(s) {
    if (!synth) return Promise.resolve();
    synth.cancel();
    const v = pickVoice();
    if (!voiceOn || !v) return Promise.resolve();
    return new Promise((done) => {
      const u = new SpeechSynthesisUtterance(speakable(s));
      u.voice = v; u.lang = v.lang; u.rate = 1.04; u.pitch = 0.92;
      speaking = true; setState("talking");
      const end = () => { speaking = false; done(); };
      u.onend = end; u.onerror = end;
      synth.speak(u);
    });
  }
  const hush = () => { if (synth) synth.cancel(); speaking = false; };
  $n("#noxVoice").addEventListener("click", () => {
    if (!pickVoice()) return;
    voiceOn = !voiceOn;
    try { localStorage.setItem(VOICE_KEY, voiceOn ? "1" : "0"); } catch {}
    if (!voiceOn) { hush(); setState("idle"); }
    paintVoice();
  });

  // Mic: the transcript goes into the box for review; nothing is sent on its own.
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  if (Rec) {
    const mic = $n("#noxMic"); mic.hidden = false;
    mic.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      rec = new Rec(); rec.lang = L() === "fr" ? "fr-FR" : "en-US"; rec.interimResults = true;
      const before = text.value ? text.value.trimEnd() + " " : "";
      rec.onresult = (e) => { text.value = before + [...e.results].map((r) => r[0].transcript).join(""); grow(); };
      rec.onend = () => { rec = null; mic.classList.remove("on"); mic.title = tx("mic"); text.focus(); };
      rec.onerror = rec.onend;
      mic.classList.add("on"); mic.title = tx("micOn");
      rec.start();
    });
  }

  /* ---------- dialogue ---------- */
  const convo = []; // {role, content}
  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  function addUser(s) {
    const d = document.createElement("div"); d.className = "nox-msg you"; d.textContent = s;
    log.appendChild(d); scrollLog();
  }
  // NOX's lines appear word by word while the mouth moves, then settle into rich text with chips.
  async function say(s, { remember = true } = {}) {
    const d = document.createElement("div"); d.className = "nox-msg nox-says";
    log.appendChild(d);
    if (remember) convo.push({ role: "assistant", content: s });
    const voice = speak(s);
    if (!isCalm()) {
      setState("talking");
      const words = speakable(s).split(/(\s+)/);
      for (let i = 0; i < words.length; i += 2) {
        d.textContent = words.slice(0, i + 1).join("");
        scrollLog();
        await new Promise((r) => setTimeout(r, 26));
      }
    }
    d.innerHTML = rich(s); scrollLog();
    await voice;
    if (!speaking) setState("idle");
  }
  function thinking(on) {
    setState(on ? "thinking" : "idle");
    let el = log.querySelector(".nox-dots");
    if (on && !el) { el = document.createElement("div"); el.className = "nox-msg nox-says nox-dots"; el.innerHTML = `<span></span><span></span><span></span><em>${esc(tx("thinking"))}</em>`; log.appendChild(el); scrollLog(); }
    if (!on && el) el.remove();
  }
  async function call(payload) {
    try {
      const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, lang: L() }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return { error: data.error || "default" };
      return data;
    } catch { return { error: "default" }; }
  }
  const errText = (e) => T[L()].err[e] || T[L()].err.default;

  let sending = false;
  async function ask(q) {
    q = q.trim().slice(0, 1000);
    if (!q || sending) return;
    sending = true; hush();
    $n("#noxSend").disabled = true;
    addUser(q); convo.push({ role: "user", content: q });
    text.value = ""; grow(); choicesEl.hidden = true;
    thinking(true);
    const res = await call({ mode: "chat", messages: convo.slice(-16) });
    thinking(false);
    if (res.reply) await say(res.reply);
    else { convo.pop(); await say(errText(res.error), { remember: false }); }
    sending = false; $n("#noxSend").disabled = false;
  }
  function grow() { text.style.height = "auto"; text.style.height = Math.min(text.scrollHeight, 140) + "px"; }
  text.addEventListener("input", grow);
  text.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(text.value); } });
  $n("#noxForm").addEventListener("submit", (e) => { e.preventDefault(); ask(text.value); });

  function renderChoices() {
    choicesEl.innerHTML = tx("choices").map((c, i) => `<button type="button" class="nox-choice" style="--i:${i}" data-q="${esc(c)}">${esc(c)}</button>`).join("") +
      `<button type="button" class="nox-choice alt" style="--i:4" data-tomatch>${esc(tx("toMatch"))}</button>`;
  }
  choicesEl.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-tomatch")) setView("match"); else ask(b.dataset.q);
  });

  /* ---------- job match ---------- */
  let matching = false;
  $n("#noxJdForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const jd = $n("#noxJd").value.trim();
    if (matching) return;
    const out = $n("#noxResult");
    if (jd.length < 40) { out.innerHTML = `<p class="nox-err">${esc(errText("jd_too_short"))}</p>`; return; }
    matching = true; hush(); setState("thinking");
    const btn = $n(".nox-go"); btn.disabled = true;
    out.innerHTML = `<div class="nox-msg nox-says nox-dots"><span></span><span></span><span></span><em>${esc(tx("thinking"))}</em></div>`;
    const res = await call({ mode: "match", jd });
    matching = false; btn.disabled = false;
    if (!res.match) { out.innerHTML = `<p class="nox-err">${esc(errText(res.error))}</p>`; setState("idle"); return; }
    renderMatch(res.match);
    const m = res.match;
    const line = `${m.score}% — ${m.verdict}. ${m.pitch}`;
    convo.push({ role: "assistant", content: `(Job match result) ${line}` });
    await speak(line);
    if (!speaking) setState("idle");
  });
  function renderMatch(m) {
    const out = $n("#noxResult");
    const st = (s) => `<span class="nox-st ${s}">${esc(tx(s))}</span>`;
    out.innerHTML = `
      <div class="nox-score" style="--p:0">
        <div class="nox-ring"><b><span class="n">0</span>%</b><small>${esc(tx("scoreLbl"))}</small></div>
        <div><h4>${esc(m.verdict || "")}</h4><div class="nox-pitch">${rich(m.pitch || "")}</div></div>
      </div>
      <h5>${esc(tx("reqs"))}</h5>
      <ul class="nox-reqs">${m.requirements.map((r) => `
        <li class="${r.status}">${st(r.status)}<span class="nox-pr ${r.priority}">${esc(tx(r.priority))}</span>
          <strong>${esc(r.req)}</strong>${r.note ? `<p>${rich(r.note).replace(/^<p>|<\/p>$/g, "")}</p>` : ""}
          ${r.evidence.length ? `<div class="nox-evs">${r.evidence.map(chip).join("")}</div>` : ""}</li>`).join("")}</ul>`;
    const box = out.querySelector(".nox-score"), n = out.querySelector(".n");
    if (isCalm()) { box.style.setProperty("--p", m.score); n.textContent = m.score; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 1100), v = Math.round(m.score * (1 - Math.pow(1 - k, 3)));
      box.style.setProperty("--p", v); n.textContent = v;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Background tabs pause animation frames: make sure the final number lands anyway.
    setTimeout(() => { box.style.setProperty("--p", m.score); n.textContent = m.score; }, 1300);
  }

  /* ---------- views, open/close, full screen ---------- */
  function setView(v) {
    agent.querySelectorAll(".nox-tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === v)));
    agent.querySelectorAll(".nox-view").forEach((el) => { el.hidden = el.dataset.v !== v; });
    (v === "match" ? $n("#noxJd") : text).focus({ preventScroll: true });
  }
  agent.querySelector(".nox-tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) setView(b.dataset.view); });

  let greeted = false;
  function greet() {
    if (greeted) return;
    greeted = true; renderChoices();
    say(tx("hello"), { remember: false });
  }
  function openPanel() {
    hideTag();
    if (current === "recruiter") return;
    float.hidden = false; bubble.hidden = true;
    float.classList.remove("in"); void float.offsetWidth; float.classList.add("in");
    greet();
    setTimeout(() => text.focus({ preventScroll: true }), 50);
  }
  function closePanel(focusBubble = true) {
    if (agent.classList.contains("full")) return;
    hush(); if (rec) rec.stop();
    float.hidden = true; bubble.hidden = false; setState("idle");
    if (focusBubble) bubble.focus({ preventScroll: true });
  }
  bubble.addEventListener("click", openPanel);
  document.addEventListener("click", (e) => { if (e.target.closest("[data-nox-open]")) { e.preventDefault(); openPanel(); } });
  $n("#noxClose").addEventListener("click", () => closePanel());

  // Keys typed into NOX must not drive the site's menus (Backspace = back, arrows = select).
  agent.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !agent.classList.contains("full")) { e.stopPropagation(); closePanel(); return; }
    if (e.key === "Escape") return; // on the full screen, Esc goes back like everywhere else
    e.stopPropagation();
  });

  // On #recruiter the same agent (and conversation) moves into the screen.
  function place() {
    const full = current === "recruiter";
    agent.classList.toggle("full", full);
    if (full) { $("#noxDock").appendChild(agent); float.hidden = true; bubble.hidden = true; hideTag(); greet(); }
    else { if (agent.parentElement !== float) { float.appendChild(agent); hush(); setState("idle"); } if (float.hidden) bubble.hidden = false; }
  }
  const baseShow = show;
  // eslint-disable-next-line no-global-assign
  show = function (id) { baseShow(id); place(); if (id === "recruiter") setTimeout(() => text.focus({ preventScroll: true }), 60); };

  /* ---------- first-visit teaser ---------- */
  function hideTag() { if (tag.hidden) return; tag.hidden = true; try { localStorage.setItem(TAG_KEY, "1"); } catch {} }
  tag.querySelector(".nox-tag-x").addEventListener("click", hideTag);
  let seen = false; try { seen = localStorage.getItem(TAG_KEY) === "1"; } catch {}
  if (!seen) setTimeout(() => { if (float.hidden && current !== "recruiter") tag.hidden = false; }, 2600);

  /* ---------- language ---------- */
  function paintText() {
    agent.querySelectorAll("[data-x]").forEach((el) => { el.textContent = tx(el.dataset.x); });
    text.placeholder = tx("placeholder"); $n("#noxJd").placeholder = tx("jdPh");
    $n("#noxSend").setAttribute("aria-label", tx("send"));
    $n("#noxFull").setAttribute("aria-label", tx("full")); $n("#noxFull").title = tx("full");
    $n("#noxClose").setAttribute("aria-label", tx("close")); $n("#noxClose").title = tx("close");
    $n("#noxMic").setAttribute("aria-label", tx("mic")); $n("#noxMic").title = tx("mic");
    bubble.setAttribute("aria-label", tx("open"));
    document.getElementById("noxRingText").textContent = tx("ring");
    tag.querySelector(".nox-tag-text").textContent = tx("tag");
    tag.querySelector(".nox-tag-x").setAttribute("aria-label", tx("tagClose"));
    if (greeted) renderChoices();
    paintVoice();
  }
  const baseSetLang = setLang;
  // eslint-disable-next-line no-global-assign
  setLang = function (l) { baseSetLang(l); hush(); paintText(); };
  paintText();
  place();
})();
