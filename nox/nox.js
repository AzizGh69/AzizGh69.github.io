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
      mic: "Speak your question", micOn: "Listening… click to stop", send: "Send", cool: "Message limit reached. You can send again in {t}.", placeholder: "Ask about Aziz's skills, projects…",
      hello: "I'm **NOX**. I represent Aziz. Ask me anything about his work, or paste a job description in **Job match** and I'll tell you how well he fits, with proof.",
      choices: ["Why should I hire Aziz?", "What data engineering has he shipped?", "Tell me about Kalori", "When is he available?"],
      // Written answers for the starter questions: instant, and no AI call. Facts only from the portfolio.
      answers: [
        "He ships whole products, and he can run a team.\n- **Hard skills:** he built and runs Kalori alone: a NestJS/TypeScript API, ~3,100 automated tests, blue/green deploys and LLM features with cost metering [quest:kalori]. Now he's building a CDC → Kafka → Microsoft Fabric lakehouse [quest:platform].\n- **Soft skills:** elected co-head of a student club's IT department [log:hec-finance-academy], project manager on several team projects, including one that won 1st prize [quest:connect], 3 competition podiums [fact:awards], and 16 months of full-time client support in French and English [log:concentrix].\nHonest caveat: he's still a student, so this is product and club experience, not a developer job.",
        "Honest answer: his main pipeline is still being built. The Kalori Data Platform runs change data capture (Debezium → Kafka) from PostgreSQL on AWS RDS into a medallion lakehouse on Microsoft Fabric, ending in Power BI; 2 of 8 milestones are reached [quest:platform]. Before that, as project manager on the BVMT Trading Assistant, his team cleaned 10 years of stock prices into PostgreSQL, with live scraping every 60 s [quest:bvmt]. He runs the platform as a real project (charter, schedule, risk register, ADRs): planning discipline, not just code.",
        "Kalori is his nutrition tracker built around Tunisian food: free, in English, French and Arabic, and usable offline [quest:kalori]. He's the founder and sole developer: 587 commits, ~3,100 automated tests behind 8 CI checks, blue/green deploys that roll back on their own, and LLM meal suggestions with a fallback and per-call cost metering. It launched publicly on 28 September and has 20+ users in testing. It shows he can own a product from idea to release: https://kalori-app.com",
        "He's looking for a 4–6 month final-year internship (PFE) from February 2027, in data engineering, AI or product [fact:availability]. He graduates in June 2027 [fact:education]. Remote work, relocation and salary aren't stated on the portfolio; Aziz answers those by email: aziz19ghazouani@gmail.com"
      ],
      toMatch: "Check a job match →",
      jdLabel: "Paste the job description", jdPh: "Paste the full job post here (title, responsibilities, requirements)…", analyze: "Analyse the match",
      thinking: "NOX is thinking…", direct: "Direct", adjacent: "Adjacent", gap: "Gap", must: "Must", nice: "Nice",
      scoreLbl: "Match", reqs: "Requirements", pitch: "Why Aziz",
      disc: "AI assistant · answers come only from this portfolio · confirm details with Aziz.",
      err: { rate_limited: "That's a lot of questions at once. Give me a minute and ask again.", busy: "My free AI quota is busy right now. Try again in a minute, or email Aziz: aziz19ghazouani@gmail.com.",
        not_configured: "I'm not switched on yet. Meanwhile, Aziz answers email: aziz19ghazouani@gmail.com.", jd_too_short: "That job description is too short. Paste the full post.",
        default: "I lost the connection for a second. Try again, or email Aziz: aziz19ghazouani@gmail.com." },
      facts: { profile: "Profile", education: "Education", languages: "Languages", certifications: "Certifications", awards: "Awards", availability: "Availability", "soft-skills": "Soft skills" }
    },
    fr: {
      title: "Agent recruteur", ring: "DEMANDEZ À NOX · MODE RECRUTEUR · DEMANDEZ À NOX · MODE RECRUTEUR · ",
      open: "Demander à NOX, l’assistant recruteur", tag: "Vous recrutez ? Je vous dis pourquoi Aziz correspond.", tagClose: "Fermer",
      chat: "Discussion", match: "Adéquation", full: "Plein écran", close: "Fermer", voiceOn: "Voix : activée", voiceOff: "Voix : coupée", noVoice: "Pas de voix pour cette langue dans votre navigateur",
      mic: "Poser votre question à voix haute", micOn: "J’écoute… cliquez pour arrêter", send: "Envoyer", cool: "Limite de messages atteinte. Vous pourrez renvoyer dans {t}.", placeholder: "Compétences, projets d’Aziz…",
      hello: "Je suis **NOX**. Je représente Aziz. Posez-moi vos questions sur son travail, ou collez une offre dans **Adéquation** : je vous dis à quel point il correspond, preuves à l’appui.",
      choices: ["Pourquoi recruter Aziz ?", "Qu’a-t-il livré en data engineering ?", "Parlez-moi de Kalori", "Quand est-il disponible ?"],
      answers: [
        "Il livre des produits complets, et il sait mener une équipe.\n- **Compétences techniques :** il a construit et fait tourner Kalori seul : une API NestJS/TypeScript, ~3 100 tests automatisés, des déploiements blue/green et des fonctions LLM avec suivi du coût [quest:kalori]. Il construit maintenant un lakehouse CDC → Kafka → Microsoft Fabric [quest:platform].\n- **Savoir-être :** élu co-responsable du pôle IT d’un club étudiant [log:hec-finance-academy], chef de projet sur plusieurs projets d’équipe, dont un 1er prix [quest:connect], 3 podiums en compétition [fact:awards], et 16 mois de support client à temps plein en français et en anglais [log:concentrix].\nPour être honnête : il est encore étudiant ; c’est une expérience de produit et de club, pas un poste de développeur.",
        "Pour être franc : son pipeline principal est encore en construction. La Kalori Data Platform fait de la capture de changements (Debezium → Kafka) depuis PostgreSQL sur AWS RDS vers un lakehouse en médaillon sur Microsoft Fabric, jusqu’à Power BI ; 2 jalons sur 8 sont atteints [quest:platform]. Avant cela, comme chef de projet du BVMT Trading Assistant, son équipe a nettoyé 10 ans de cours boursiers dans PostgreSQL, avec un scraping en direct toutes les 60 s [quest:bvmt]. Il mène la plateforme comme un vrai projet (charte, planning, registre des risques, ADR) : de la rigueur, pas seulement du code.",
        "Kalori est son application de suivi nutritionnel pensée pour la cuisine tunisienne : gratuite, en anglais, français et arabe, et utilisable hors ligne [quest:kalori]. Il en est le fondateur et l’unique développeur : 587 commits, ~3 100 tests automatisés derrière 8 vérifications CI, des déploiements blue/green qui reviennent en arrière seuls, et des suggestions de repas par LLM avec repli et suivi du coût par appel. Lancement public le 28 septembre, plus de 20 utilisateurs en test. Cela montre qu’il peut porter un produit de l’idée à la mise en ligne : https://kalori-app.com",
        "Il cherche un stage de fin d’études (PFE) de 4 à 6 mois à partir de février 2027, en data engineering, IA ou produit [fact:availability]. Il sera diplômé en juin 2027 [fact:education]. Télétravail, mobilité et salaire ne sont pas précisés sur le portfolio ; Aziz y répond par e-mail : aziz19ghazouani@gmail.com"
      ],
      toMatch: "Tester une offre →",
      jdLabel: "Collez l’offre d’emploi", jdPh: "Collez l’offre complète ici (intitulé, missions, profil recherché)…", analyze: "Analyser l’adéquation",
      thinking: "NOX réfléchit…", direct: "Direct", adjacent: "Proche", gap: "Manque", must: "Requis", nice: "Bonus",
      scoreLbl: "Adéquation", reqs: "Exigences", pitch: "Pourquoi Aziz",
      disc: "Assistant IA · réponses tirées uniquement de ce portfolio · à confirmer avec Aziz.",
      err: { rate_limited: "Beaucoup de questions d’un coup. Laissez-moi une minute.", busy: "Mon quota d’IA gratuit est saturé. Réessayez dans une minute, ou écrivez à Aziz : aziz19ghazouani@gmail.com.",
        not_configured: "Je ne suis pas encore branché. En attendant, Aziz répond par e-mail : aziz19ghazouani@gmail.com.", jd_too_short: "L’offre est trop courte. Collez le texte complet.",
        default: "J’ai perdu la connexion un instant. Réessayez, ou écrivez à Aziz : aziz19ghazouani@gmail.com." },
      facts: { profile: "Profil", education: "Formation", languages: "Langues", certifications: "Certifications", awards: "Distinctions", availability: "Disponibilité", "soft-skills": "Savoir-être" }
    }
  };
  const L = () => (typeof lang !== "undefined" && lang === "fr" ? "fr" : "en");
  const tx = (k) => T[L()][k];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isCalm = () => document.documentElement.classList.contains("calm") || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slug = (s) => s.toLowerCase().replace(/#/g, "sharp").replace(/[+]/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ---------- the character: a generated portrait (Workers AI, FLUX.1 schnell), an original fictional agent ---------- */

  /* ---------- DOM ---------- */
  const bubble = document.createElement("button");
  bubble.type = "button"; bubble.className = "nox-bubble"; bubble.id = "noxBubble";
  bubble.innerHTML = `<svg class="nox-ringtext" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="noxRingPath" d="M60 60m-50 0a50 50 0 1 1 100 0a50 50 0 1 1 -100 0"/></defs><text><textPath href="#noxRingPath" id="noxRingText"></textPath></text></svg>
    <span class="nox-moon"><img class="nox-photo" src="nox/nox-bubble.webp?v=3" alt="" width="192" height="192" decoding="async"></span><span class="nox-ping" aria-hidden="true"></span>`;

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
    <div class="nox-figure"><img class="nox-photo" src="nox/nox-portrait.webp?v=3" alt="" width="720" height="720" loading="lazy" decoding="async"></div>
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
        <span class="nox-cool" id="noxCool" role="tooltip"></span>
      </form>
    </div>
    <div class="nox-view" data-v="match" hidden>
      <form class="nox-jd" id="noxJdForm">
        <label for="noxJd" data-x="jdLabel"></label>
        <textarea id="noxJd" maxlength="5000"></textarea>
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
  async function callOnce(payload) {
    try {
      const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, lang: L() }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return { error: data.error || "default", retryAfter: data.retryAfter };
      return data;
    } catch { return { error: "default" }; }
  }
  // Free AI tiers refill within seconds: when every model is busy, wait a moment and try once more.
  async function call(payload) {
    const first = await callOnce(payload);
    if (first.error !== "busy" && first.error !== "model_error") return first;
    await new Promise((r) => setTimeout(r, 8000));
    return callOnce(payload);
  }
  const errText = (e) => T[L()].err[e] || T[L()].err.default;

  /* ---------- cooldown after the message limit ---------- */
  // The server says how long until the next message is allowed; the send icon shows the time left on hover.
  const COOL_KEY = "nox-cool";
  let coolUntil = 0, coolTimer = 0, tipTimer = 0;
  try { coolUntil = Number(localStorage.getItem(COOL_KEY)) || 0; } catch {}
  const coolLeft = () => Math.max(0, Math.ceil((coolUntil - Date.now()) / 1000));
  const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  function paintCool() {
    clearTimeout(coolTimer);
    const left = coolLeft(), on = left > 0, form = $n("#noxForm"), send = $n("#noxSend"), tip = $n("#noxCool");
    form.classList.toggle("is-cool", on);
    send.setAttribute("aria-disabled", String(on));
    if (on) {
      tip.textContent = tx("cool").replace("{t}", clock(left));
      send.setAttribute("aria-label", tip.textContent);
      send.setAttribute("aria-describedby", "noxCool");
      coolTimer = setTimeout(paintCool, 1000);
    } else {
      form.classList.remove("show-tip");
      send.setAttribute("aria-label", tx("send"));
      send.removeAttribute("aria-describedby");
      try { localStorage.removeItem(COOL_KEY); } catch {}
    }
    return on;
  }
  function startCool(seconds) {
    coolUntil = Date.now() + Math.min(Number(seconds) || 60, 900) * 1000;
    try { localStorage.setItem(COOL_KEY, String(coolUntil)); } catch {}
    paintCool();
  }
  // Touch screens have no hover: a tap on the cooling icon shows the time for a few seconds.
  function flashTip() {
    const form = $n("#noxForm");
    form.classList.add("show-tip");
    clearTimeout(tipTimer); tipTimer = setTimeout(() => form.classList.remove("show-tip"), 3000);
  }

  let sending = false;
  async function ask(q) {
    q = q.trim().slice(0, 1000);
    if (paintCool()) { flashTip(); return; }
    if (!q || sending) return;
    sending = true; hush();
    $n("#noxSend").disabled = true;
    addUser(q); convo.push({ role: "user", content: q });
    text.value = ""; grow(); choicesEl.hidden = true;
    thinking(true);
    const res = await call({ mode: "chat", messages: convo.slice(-10) });
    thinking(false);
    if (res.reply) await say(res.reply);
    else { convo.pop(); text.value = q; grow(); if (res.retryAfter) startCool(res.retryAfter); await say(errText(res.error), { remember: false }); }
    sending = false; $n("#noxSend").disabled = false;
  }
  function grow() { text.style.height = "auto"; text.style.height = Math.min(text.scrollHeight, 140) + "px"; }
  text.addEventListener("input", grow);
  text.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(text.value); } });
  $n("#noxForm").addEventListener("submit", (e) => { e.preventDefault(); ask(text.value); });

  function renderChoices() {
    choicesEl.innerHTML = tx("choices").map((c, i) => `<button type="button" class="nox-choice" style="--i:${i}" data-i="${i}">${esc(c)}</button>`).join("") +
      `<button type="button" class="nox-choice alt" style="--i:4" data-tomatch>${esc(tx("toMatch"))}</button>`;
  }
  choicesEl.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-tomatch")) setView("match"); else answerChoice(Number(b.dataset.i));
  });
  // Starter questions have written answers: no AI call, but they join the history so follow-ups keep context.
  async function answerChoice(i) {
    const q = tx("choices")[i], a = tx("answers")[i];
    if (!q || !a) return;
    if (sending) return;
    sending = true; hush();
    addUser(q); convo.push({ role: "user", content: q });
    choicesEl.hidden = true;
    thinking(true);
    await new Promise((r) => setTimeout(r, isCalm() ? 0 : 450));
    thinking(false);
    await say(a);
    sending = false;
  }

  /* ---------- job match ---------- */
  let matching = false;
  $n("#noxJdForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const jd = $n("#noxJd").value.trim();
    if (matching) return;
    const out = $n("#noxResult");
    if (paintCool()) { out.innerHTML = `<p class="nox-err">${esc($n("#noxCool").textContent)}</p>`; return; }
    if (jd.length < 40) { out.innerHTML = `<p class="nox-err">${esc(errText("jd_too_short"))}</p>`; return; }
    matching = true; hush(); setState("thinking");
    const btn = $n(".nox-go"); btn.disabled = true;
    out.innerHTML = `<div class="nox-msg nox-says nox-dots"><span></span><span></span><span></span><em>${esc(tx("thinking"))}</em></div>`;
    const res = await call({ mode: "match", jd });
    matching = false; btn.disabled = false;
    if (res.retryAfter) startCool(res.retryAfter);
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
    document.body.dataset.screen = current;
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
    paintCool();
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
