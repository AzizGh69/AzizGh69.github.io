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

  /* ---------- the character (inline SVG, ids prefixed so it can appear twice) ---------- */
  function noxSVG(p, view, fit = "xMidYMid meet") {
    const card = (x, y) => `font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-style="italic" font-size="6" fill="#fff" x="${x}" y="${y}" text-anchor="middle"`;
    return `<svg class="nox-svg" viewBox="${view}" preserveAspectRatio="${fit}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs>
  <radialGradient id="${p}moon" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#E4FAFF"/><stop offset=".82" stop-color="#8FD9FF" stop-opacity=".5"/><stop offset="1" stop-color="#4FE6FF" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}halo" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#4FE6FF" stop-opacity=".22"/><stop offset="1" stop-color="#4FE6FF" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}hair" x1=".1" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#F7FBFF"/><stop offset=".35" stop-color="#C9D7F6"/><stop offset=".75" stop-color="#7D93D6"/><stop offset="1" stop-color="#4A62B4"/></linearGradient>
  <linearGradient id="${p}lock" gradientUnits="userSpaceOnUse" x1="0" y1="46" x2="0" y2="100"><stop offset="0" stop-color="#F2F7FF"/><stop offset=".5" stop-color="#C3D2F4"/><stop offset="1" stop-color="#8197DA"/></linearGradient>
  <linearGradient id="${p}hairDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5068B8"/><stop offset="1" stop-color="#1C2A6A"/></linearGradient>
  <radialGradient id="${p}skin" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="#FCE9DC"/><stop offset=".55" stop-color="#F2D0BC"/><stop offset="1" stop-color="#D7A68D"/></radialGradient>
  <linearGradient id="${p}neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7836E"/><stop offset=".45" stop-color="#DDAE96"/><stop offset="1" stop-color="#E8C0A9"/></linearGradient>
  <linearGradient id="${p}coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2149B8"/><stop offset=".45" stop-color="#11298A"/><stop offset="1" stop-color="#050C2A"/></linearGradient>
  <linearGradient id="${p}side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".32" stop-color="#000" stop-opacity="0"/><stop offset=".68" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
  <linearGradient id="${p}lapel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D5BD6"/><stop offset="1" stop-color="#0F2479"/></linearGradient>
  <linearGradient id="${p}tie" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FF0FF"/><stop offset=".25" stop-color="#2CC3EA"/><stop offset="1" stop-color="#0C4FA0"/></linearGradient>
  <linearGradient id="${p}visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14358F" stop-opacity=".9"/><stop offset=".6" stop-color="#071A55" stop-opacity=".78"/><stop offset="1" stop-color="#4FE6FF" stop-opacity=".45"/></linearGradient>
  <filter id="${p}glow" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${p}soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>
  <filter id="${p}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter>
  <clipPath id="${p}coatClip"><path d="M10 230C14 184 40 158 78 148L100 168L122 148C160 158 186 184 190 230Z"/></clipPath>
</defs>
<g class="nox-moonbg">
  <circle cx="128" cy="70" r="80" fill="url(#${p}halo)"/>
  <circle cx="128" cy="70" r="64" fill="url(#${p}moon)"/>
  <circle cx="146" cy="52" r="7" fill="#9BC9E8" opacity=".22"/><circle cx="112" cy="40" r="4" fill="#9BC9E8" opacity=".2"/><circle cx="156" cy="88" r="5" fill="#9BC9E8" opacity=".18"/><circle cx="160" cy="62" r="2.6" fill="#9BC9E8" opacity=".2"/>
  <circle cx="128" cy="70" r="74" fill="none" stroke="#D6F7FF" stroke-opacity=".25" stroke-width=".6" stroke-dasharray="2 5"/>
</g>
<path d="M57 100C47 62 59 26 98 21C139 17 156 48 147 92C145 106 141 118 135 126L128 94H72L65 126C60 116 58 108 57 100Z" fill="url(#${p}hairDark)"/>
<path d="M87 112H113L115 145Q100 156 85 145Z" fill="url(#${p}neck)"/>
<path d="M88 122Q100 136 112 122L113 130Q100 142 87 130Z" fill="#A5705C" opacity=".45" filter="url(#${p}soft)"/>
<path d="M10 230C14 184 40 158 78 148L100 168L122 148C160 158 186 184 190 230Z" fill="url(#${p}coat)"/>
<g clip-path="url(#${p}coatClip)">
  <rect x="0" y="140" width="200" height="90" fill="url(#${p}side)"/>
  <rect x="0" y="140" width="200" height="90" filter="url(#${p}grain)" opacity=".07"/>
  <path d="M40 196Q54 212 48 232M160 194Q148 212 154 232M70 214Q76 222 74 232" stroke="#030820" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>
  <path d="M42 194Q55 208 50 230M158 192Q147 208 152 230" stroke="#6F93F2" stroke-width=".8" fill="none" opacity=".35"/>
</g>
<path d="M122 148C158 157 182 180 189 226" stroke="#4FE6FF" stroke-width="1.8" fill="none" opacity=".75" stroke-linecap="round"/>
<path d="M78 148C44 157 20 178 12 214" stroke="#D6F7FF" stroke-width="1" fill="none" opacity=".3" stroke-linecap="round"/>
<path d="M56 160L84 208M144 160L116 208" stroke="#4FE6FF" stroke-width="1.1" opacity=".4"/>
<path d="M84 148L100 187L116 148L108 143L100 158L92 143Z" fill="#EEF5FF"/>
<path d="M92 143L100 158L108 143L110 146L100 164L90 146Z" fill="#C9D6EE"/>
<path d="M96.5 156H103.5L102.6 162.5H97.4Z" fill="#2CC3EA"/>
<path d="M97.4 162.5H102.6L105 168L102.6 199L100 204L97.4 199L95 168Z" fill="url(#${p}tie)"/>
<path d="M99.2 165L98.6 196" stroke="#fff" stroke-opacity=".45" stroke-width=".8"/>
<path d="M77 149L86 121L98 160L92 178Z" fill="url(#${p}lapel)" stroke="#4FE6FF" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M123 149L114 121L102 160L108 178Z" fill="url(#${p}lapel)" stroke="#4FE6FF" stroke-width="1.2" stroke-linejoin="round"/>
<path d="M86 121L89 132L95 156" stroke="#9FEFFF" stroke-width=".7" fill="none" opacity=".7"/>
<path d="M114 121L111 132L105 156" stroke="#9FEFFF" stroke-width=".7" fill="none" opacity=".5"/>
<g filter="url(#${p}glow)"><circle cx="115" cy="166" r="3.6" fill="#FFC547"/><circle cx="116.6" cy="164.8" r="3.1" fill="#12298B"/></g>
<circle cx="100" cy="214" r="2.1" fill="#0A1A58" stroke="#4FE6FF" stroke-width=".8"/>
<g filter="url(#${p}glow)"><circle cx="64" cy="190" r="6" fill="#4FE6FF"/><circle cx="66.6" cy="188" r="5.4" fill="#0D2266"/></g>
<path d="M68 84C60.5 81.5 59 98 69 103Z" fill="#E7BBA3"/><path d="M67 88C64 89 64.5 96 68 98" stroke="#B9826C" stroke-width="1.1" fill="none" stroke-linecap="round"/>
<path d="M132 84C139.5 81.5 141 98 131 103Z" fill="#D7A68D"/>
<path d="M68 72C68 44 132 44 132 72L130 100C127 118 114 132 100 133C86 132 73 118 70 100Z" fill="url(#${p}skin)"/>
<path d="M70 100C73 118 86 132 100 133C114 132 127 118 130 100C125 115 113 125 100 126C87 125 75 115 70 100Z" fill="#B8806A" opacity=".32"/>
<path d="M130 74L130 100C128 112 122 122 114 128C122 118 126 104 126 90Z" fill="#9C6B5A" opacity=".22"/>
<path d="M131 78L130 100C128 112 121 123 112 129" stroke="#4FE6FF" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/>
<path d="M70 76C82 68 118 66 132 74L132 82C116 76 84 78 70 86Z" fill="#2A3D86" opacity=".28" filter="url(#${p}soft)"/>
<ellipse cx="79" cy="108" rx="6.5" ry="3.2" fill="#F08A8A" opacity=".24" filter="url(#${p}soft)"/><ellipse cx="121" cy="108" rx="6.5" ry="3.2" fill="#F08A8A" opacity=".24" filter="url(#${p}soft)"/>
<path d="M78 77Q86 72.5 95 74.5M105 74.5Q114 72.5 122 76" stroke="#3E56A8" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M64 81L137 78L135 98Q100 102.5 67 100Z" fill="url(#${p}visor)" stroke="#4FE6FF" stroke-width="1" stroke-linejoin="round"/>
<g class="nox-eyes" filter="url(#${p}glow)">
  <g class="nox-eye"><path d="M79.5 90.5Q87 84.5 94.5 89.5Q87 95.5 79.5 90.5Z" fill="#4FE6FF"/><circle cx="88.5" cy="89.2" r="1.3" fill="#fff"/></g>
  <g class="nox-eye"><path d="M105.5 89.5Q113 84 120.5 89Q113 95 105.5 89.5Z" fill="#4FE6FF"/><circle cx="114.5" cy="88.4" r="1.3" fill="#fff"/></g>
</g>
<path d="M66 83.5L136 80.5L135.7 83L66.3 86Z" fill="#fff" opacity=".32"/>
<path d="M107 79L116 78.6L109.5 99.5L100.5 100Z" fill="#fff" opacity=".1"/>
<path d="M70 96.5H76M124 94.5H130M72 98.5H74" stroke="#4FE6FF" stroke-width=".8" opacity=".7"/>
<path d="M100.6 101L98 107.4Q100.2 109.2 102.8 107.8" stroke="#B07A66" stroke-width="1.15" fill="none" stroke-linecap="round"/>
<path d="M101.2 101.5L100.4 105" stroke="#fff" stroke-opacity=".45" stroke-width=".9" stroke-linecap="round"/>
<g class="nox-mouth">
  <g class="m0"><path d="M92 116.5Q100 121 108 115" stroke="#8A4A45" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M95 119.5Q100 122 105 119" stroke="#D99484" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/></g>
  <path class="m1" d="M93 116Q100 114.5 107 116Q100 123 93 116Z" fill="#5A2430"/>
  <path class="m2" d="M92 115Q100 112.5 108 115Q101 128 92 115Z" fill="#5A2430"/>
</g>
<path d="M60 88C55 58 72 31 100 29C129 27 147 48 142 86C131 72 114 63 100 63C86 63 71 71 60 88Z" fill="url(#${p}hair)"/>
<g fill="url(#${p}lock)" stroke="#5B72C2" stroke-width=".6" stroke-opacity=".6" stroke-linejoin="round">
  <path d="M62 62C63 76 66 90 71 99C71 86 73 72 80 61Z"/>
  <path d="M74 54C77 66 79 75 83 81C84 71 87 61 94 53Z"/>
  <path d="M88 49C91 62 95 72 101 79C100 68 102 58 109 50Z"/>
  <path d="M103 49C107 61 112 71 119 78C117 67 117 58 121 52Z"/>
  <path d="M116 53C122 63 127 73 133 84C131 73 131 63 130 57Z"/>
  <path d="M127 58C134 68 137 79 138 92C141 80 141 69 136 60Z"/>
</g>
<path d="M66 70C70 64 76 60 82 58M80 62C86 56 94 53 100 52M97 56C104 52 112 52 118 55" stroke="#fff" stroke-width="1" fill="none" opacity=".5" stroke-linecap="round"/>
<path d="M84 40Q90 50 90 60M100 36Q104 46 104 58M116 40Q121 50 122 60" stroke="#4A62B4" stroke-width=".9" fill="none" opacity=".4"/>
<path d="M62 78L55 122L68 103L72 86Z" fill="url(#${p}hair)"/>
<path d="M139 76L145 114L134 101Z" fill="url(#${p}hair)"/>
<path d="M98 30C104 15 121 11 128 20C117 17 109 22 104 32Z" fill="#DCE6FB"/>
<path d="M77 41C91 33 112 33 126 41" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M127 33C141 45 147 66 142 86M139 77L145 114" stroke="#4FE6FF" stroke-width="1.3" fill="none" opacity=".7" stroke-linecap="round"/>
<rect x="130" y="86" width="8" height="14" rx="3.5" fill="#0B1E57" stroke="#4FE6FF" stroke-width="1"/>
<path d="M132 88.5H136" stroke="#fff" stroke-opacity=".35" stroke-width=".8" stroke-linecap="round"/>
<circle class="nox-led" cx="134" cy="94" r="1.7" fill="#4FE6FF"/>
<path d="M134 100Q131 116 116 120" stroke="#0B1E57" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="116" cy="120" r="2" fill="#4FE6FF"/>
<g class="nox-card" transform="translate(138 156) rotate(12)">
  <rect width="38" height="58" rx="3" fill="#040A1C" stroke="#4FE6FF" stroke-width="1.4"/>
  <rect x="3" y="3" width="32" height="52" rx="2" fill="none" stroke="#FFC547" stroke-width=".7"/>
  <path d="M6 6L10 6M6 6L6 10M32 6L28 6M32 6L32 10M6 52L10 52M6 52L6 48M32 52L28 52M32 52L32 48" stroke="#FFC547" stroke-width=".9"/>
  <circle cx="19" cy="22" r="11" fill="#4FE6FF" opacity=".18"/>
  <circle cx="19" cy="22" r="9" fill="#D6F7FF"/><circle cx="23" cy="19" r="8" fill="#040A1C"/>
  <circle cx="9" cy="14" r=".7" fill="#fff"/><circle cx="29" cy="30" r=".6" fill="#fff"/><circle cx="28" cy="11" r=".5" fill="#fff"/>
  <path d="M8 34L30 34" stroke="#FFC547" stroke-width=".6"/>
  <text ${card(19, 43)}>THE</text>
  <text ${card(19, 50)} letter-spacing=".2">CANDIDATE</text>
  <path d="M4 4L34 4L30 18Z" fill="#fff" opacity=".06"/>
</g>
</svg>`;
  }

  /* ---------- DOM ---------- */
  const bubble = document.createElement("button");
  bubble.type = "button"; bubble.className = "nox-bubble"; bubble.id = "noxBubble";
  bubble.innerHTML = `<svg class="nox-ringtext" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="noxRingPath" d="M60 60m-50 0a50 50 0 1 1 100 0a50 50 0 1 1 -100 0"/></defs><text><textPath href="#noxRingPath" id="noxRingText"></textPath></text></svg>
    <span class="nox-moon">${noxSVG("b", "50 30 100 100")}</span><span class="nox-ping" aria-hidden="true"></span>`;

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
