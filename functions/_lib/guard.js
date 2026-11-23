import { IDS, LINKS, SKILL_RANK, CERT_STATUS, TOOLS } from "./knowledge.js";
import { PROMPT_FINGERPRINTS } from "./prompt.js";

const ID_SET = new Set(IDS);
export const LIMITS = { turns: 10, message: 1000, jd: 5000, reply: 2500 };

// Strip control, zero-width and bidi characters that hide or reorder text; normalise width tricks.
export function clean(s, max) {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g, "")
    .slice(0, max)
    .trim();
}

// Text that tries to re-instruct the model. Not trusted, not blocked: flagged so the model treats it as data.
const INJECTION = [
  /ignore (all |any |the )?(previous|prior|above|earlier|your)/i,
  /disregard (all |the )?(previous|prior|above|instructions|rules)/i,
  /(system|developer) (prompt|message|instructions?)/i,
  /(reveal|repeat|print|show|output) (me )?(your|the) (hidden |initial |system )?(prompt|instructions|rules)/i,
  /you are (now|no longer)|act as|pretend (to be|you)|role-?play|jailbreak|\bDAN\b|developer mode/i,
  /new (instructions|rules|persona)/i,
  /<\/?(system|assistant|user_message|job_description|knowledge)>/i,
  /\[(INST|SYS)\]|<\|im_start\|>|###\s*(system|instruction)/i,
  /(oublie|ignore)[sz]? (toutes? )?(les |tes |vos )?(instructions|consignes|règles)/i,
  /(score|match)[^.\n]{0,30}(100|cent) ?%/i,
  /\b(system|admin|developer|important)\s+(note|notice|override|message|update)\b/i,
  /\bmark\s+(every|all|each)\s+(requirements?|items?|skills?)\b[^.\n]{0,30}\b(direct|match(ed)?|met)\b/i,
  /\b(return|give|set|output|assign|report)\s+(a\s+|the\s+)?(score|match)\s*(of|=|:|to)?\s*\d{2,3}\b/i,
  /\b(score|match)\s*(of|=|:)?\s*100\b/i,
  /\b(note|instruction|message)\s+(to|for)\s+(the\s+)?(ai|assistant|model|llm|nox|recruiter bot)\b/i,
  /\b(mets|donne|attribue|renvoie)\s+(un\s+)?(score|taux)\s+(de\s+)?100\b/i
];
export const looksLikeInjection = (s) => INJECTION.some((r) => r.test(s));

// A job description is data: sentences that try to steer the scorer are not requirements, so they are removed
// before the model sees them (the model is also warned). Returns the cleaned text and whether anything was cut.
export function stripInjection(s) {
  let cut = false;
  const kept = s.split(/(?<=[.!?\n])/).filter((part) => {
    if (looksLikeInjection(part)) { cut = true; return false; }
    return true;
  });
  return { text: kept.join("").trim(), cut };
}

// Our own tags inside visitor text could close the fence early, so neutralise them.
export const fence = (s) => s.replace(/<\s*\/?\s*(user_message|job_description|knowledge|system)\s*>/gi, "[tag removed]");

/* Overstatements the models keep making, rewritten to what the portfolio says.
   Aziz co-led the club's IT department, which ran the 220-participant hackathon on its own software;
   he did not lead the hackathon itself. */
const H = "[-‐‑ ]";
const SLIPS = [
  [new RegExp(`\\b(?:co${H}?led|led|ran|organi[sz]ed|managed|headed)\\s+(?:a|the)\\s+(?:student\\s+)?220${H}(?:person|participant|people)s?\\s+(?:student\\s+)?hackathons?`, "gi"),
    "co-led the IT department that ran a 220-participant hackathon"],
  [new RegExp(`\\b(?:co${H}?led|led|ran|organi[sz]ed|managed|headed)\\s+(?:a\\s+|the\\s+)?(?:student\\s+)?hackathons?\\s+(?:for|of|with)\\s+(?:220|hundreds\\s+of)\\s+(?:participants|people)`, "gi"),
    "co-led the IT department that ran a 220-participant hackathon"],
  [new RegExp(`\\b(?:co${H}?dirigé|dirigé|organisé|piloté|mené)\\s+un\\s+hackathon\\s+(?:étudiant\\s+)?de\\s+220\\s+(?:personnes|participants)`, "gi"),
    "co-dirigé le pôle IT qui a organisé un hackathon de 220 participants"],
  // Puffery the prompt bans but models still write.
  [/\bproving\b/g, "showing"], [/\bProving\b/g, "Showing"], [/\bproven by\b/g, "shown by"],
  [/\b(production|commercial|enterprise)[-‐‑ ]grade\b/gi, "production"]
];
// "the IT department that ran a 220-person hackathon" is already right: leave it alone.
const ALREADY_RIGHT = /\b(?:that|which|who|qui(?: a)?),?\s$/i;
const fixKnownSlips = (t) => SLIPS.reduce((s, [re, to]) =>
  s.replace(re, (m, ...args) => { const at = args[args.length - 2]; return ALREADY_RIGHT.test(s.slice(Math.max(0, at - 12), at)) ? m : to; }), t);

// Keep only [ids] that exist and URLs we published; drop HTML; cap length; catch prompt leaks.
export function sanitizeReply(text) {
  let t = String(text ?? "").replace(/<[^>]*>/g, "")
    // Markdown links show as raw text in the chat: keep the visible text (the URL check below still applies).
    .replace(/\[([^\]\n]{1,200})\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g, (m, label, url) =>
      /^mailto:/i.test(url) ? url.slice(7) : label.trim() === url ? url : `${label} (${url})`);
  // Normalise citations ("[ quest:kalori ]", "[skill:sql, skill:python]") to "[id]" and drop ids that do not exist.
  t = t.replace(/\[\s*((?:[a-z]+:[a-z0-9-]+|cv)(?:\s*[,;]\s*(?:[a-z]+:[a-z0-9-]+|cv))*)\s*\]/gi, (m, list) =>
    list.split(/\s*[,;]\s*/).map((id) => id.toLowerCase()).filter((id) => ID_SET.has(id)).map((id) => `[${id}]`).join(" "));
  // Anything else shaped like a citation ("[skill:*]", "[quest:unknown]") would show as raw text: drop it.
  t = t.replace(/\s?\[\s*(?:quest|cert|skill|log|fact)\s*:[^\]\n]{0,60}\]/gi, (m) => (ID_SET.has(m.trim().slice(1, -1).trim().toLowerCase()) ? m : ""));
  t = t.replace(/\b(?:https?:\/\/|mailto:)[^\s)\]]+/gi, (u) => {
    const bare = u.replace(/[.,;:!?]+$/, "");
    return LINKS.some((l) => bare === l || bare === l.replace(/\/$/, "") || bare.startsWith("https://aziz-ghazouani.pages.dev")) ? u : "";
  });
  t = fixKnownSlips(t).replace(/\s?\[team result\]/gi, "");
  if (PROMPT_FINGERPRINTS.some((f) => t.includes(f))) return null;
  return t.slice(0, LIMITS.reply).trim();
}

// The score is computed here from validated evidence, never taken from the model.
const SKILL_STRENGTH = { P: 1, R: 1, B: 0.95, C: 0.85, F: 0.75 };
function strength(ids) {
  let best = 0;
  for (const id of ids) {
    if (id.startsWith("skill:")) best = Math.max(best, SKILL_STRENGTH[SKILL_RANK[id]] ?? 0.75);
    else if (id.startsWith("cert:")) best = Math.max(best, CERT_STATUS[id] === "prep" ? 0.8 : 1);
    else best = Math.max(best, 1);
  }
  return best;
}
/* Models disagree on the same requirement (Kafka "direct" in one run, "gap" in the next), so a requirement that
   names only tools from Aziz's skills or project stacks is decided here: direct, with that evidence.
   Anything with other words left over ("Kafka streaming at scale", "Hadoop and Python", "5 years of SQL") stays
   with the model. */
const FILLER = new Set(("experience with of in on and or the a an strong solid good proven hands-on hands knowledge proficiency proficient " +
  "skills skill familiarity familiar working work using use plus nice to have must required preferred ability expertise background " +
  "understanding tools tool framework frameworks language languages apache microsoft google amazon de en et ou la le les avec maîtrise " +
  "connaissance connaissances bonne bonnes compétences expérience outils").split(" "));
const NOT_TOOLS = new Set(["deployment", "dns"]);
/* Tools Aziz has not used but has a real transferable skill for. Decided here, not by the model, so the same
   requirement always scores the same: adjacent, with this evidence and this note (never direct, never gap).
   Spark itself is direct: PySpark is Spark's Python API. */
const SPARK = ["skill:pyspark", "quest:platform"];
const ADJ_NOTE = {
  hadoop: { en: "Hadoop is not on the portfolio; his PySpark work in the data platform is the transferable Spark-ecosystem skill.",
    fr: "Hadoop n'apparaît pas sur le portfolio ; son travail PySpark dans la plateforme de données est la compétence transférable de l'écosystème Spark." },
  scala: { en: "Scala is not on the portfolio; Java (used in projects) and PySpark (Spark's Python API) are the transferable skills.",
    fr: "Scala n'apparaît pas sur le portfolio ; Java (utilisé en projet) et PySpark (l'API Python de Spark) sont les compétences transférables." },
  databricks: { en: "Databricks is not on the portfolio; he works with PySpark on Microsoft Fabric, the same lakehouse and Spark model.",
    fr: "Databricks n'apparaît pas sur le portfolio ; il travaille avec PySpark sur Microsoft Fabric, le même modèle lakehouse et Spark." }
};
const ADJACENT = {
  hadoop: [SPARK, "hadoop"], hdfs: [SPARK, "hadoop"], mapreduce: [SPARK, "hadoop"], "map reduce": [SPARK, "hadoop"],
  hive: [SPARK, "hadoop"], yarn: [SPARK, "hadoop"], "big data": [SPARK, "hadoop"],
  scala: [["skill:java", "skill:pyspark"], "scala"],
  databricks: [["skill:pyspark", "skill:microsoft-fabric"], "databricks"]
};
const DIRECT_EXTRA = { spark: ["skill:pyspark", "quest:platform"], "spark sql": ["skill:pyspark", "skill:sql"] };
const ALL_KEYS = [...new Set([...Object.keys(TOOLS).filter((k) => !NOT_TOOLS.has(k) && k.length >= 2), ...Object.keys(ADJACENT), ...Object.keys(DIRECT_EXTRA)])];
const toolKey = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, (m) => " " + m.slice(1, -1) + " ").replace(/[^a-z0-9#+.àâçéèêëîïôûù-]+/g, " ").trim();
// Returns { status, ids, note } when every word of the requirement is a known tool (or filler), else null.
const hasKey = (text, k) => new RegExp(`(^|[^a-z0-9#+.])${k.replace(/[.+#]/g, "\\$&")}($|[^a-z0-9#+])`).test(text);
const idsOf = (keys) => [...new Set(keys.flatMap((k) => ADJACENT[k]?.[0] || DIRECT_EXTRA[k] || TOOLS[k]))]
  .sort((a, b) => (a.startsWith("skill:") ? 0 : 1) - (b.startsWith("skill:") ? 0 : 1)).slice(0, 4);
function toolEvidence(req) {
  const text = toolKey(req);
  if (!text) return null;
  const keys = ALL_KEYS.filter((k) => hasKey(text, k)).sort((a, b) => b.length - a.length);
  // Longer keys win ("spark sql" over "sql"): drop keys that sit inside a longer one already matched.
  const used = keys.filter((k, i) => !keys.slice(0, i).some((l) => l.includes(k)));
  const adj = used.filter((k) => ADJACENT[k]);
  const years = /\d+\s*\+?\s*(years?|yrs?|ans?|années?)\b/.test(text);
  if (years) {
    // "3 years of Hadoop": he has none, whatever the model thinks. Other "N years" requirements stay with the model.
    return adj.length ? { status: "gap", ids: [], note: null, fixed: true } : null;
  }
  if (!used.length) return null;
  let rest = " " + text + " ";
  for (const k of keys) rest = rest.split(k).join(" ");
  const left = rest.split(/[\s,/&.-]+/).filter((w) => w && !FILLER.has(w));
  const direct = used.filter((k) => !ADJACENT[k]);
  const either = /\b(or|ou)\b/.test(text);
  if (left.length) {
    // Extra words ("Hadoop streaming at scale"): a known tool alone is not enough to decide, but a tool he has not
    // used is still only adjacent, never direct and never a gap.
    if (!adj.length) return null;
    return { status: "adjacent", ids: idsOf(adj), note: ADJACENT[adj[0]][1] };
  }
  // "Scala or Java": one he has is enough. "Hadoop and Python": the one he has not used makes it adjacent.
  if (adj.length && !(either && direct.length)) return { status: "adjacent", ids: idsOf(used), note: ADJACENT[adj[0]][1] };
  return { status: "direct", ids: idsOf(either && adj.length ? direct : used), note: null };
}

/* Soft skills and languages, decided here from the SOFT SKILLS evidence so the same requirement always gets the same
   status, evidence and note. Matched on accent-free text; a requirement with other words left over
   ("leading data teams of 10") stays with the model. */
const deaccent = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ");
const SOFT = [
  { re: /\b(soft skills|savoir etre|qualites humaines)\b/g, status: "direct", ids: ["fact:soft-skills", "cert:hecfa-lead", "fact:awards", "log:concentrix"],
    en: "Elected co-head of his club's IT department, 3 competition podiums and 16 months of bilingual client support.",
    fr: "Co-responsable élu du pôle IT de son club, 3 podiums en compétition et 16 mois de support client bilingue." },
  { re: /\b(communication|communicat\w*|communiquer|interpersonal|people skills|stakeholders?(?: management)?|client facing|customer facing|client relations?|relationnel(?:le)?|relation client|parties prenantes)\b/g,
    status: "direct", ids: ["fact:soft-skills", "log:concentrix", "quest:epistemia"],
    en: "16 months of bilingual client support at Concentrix, and he runs the meetings and client communication on Epistemia.",
    fr: "16 mois de support client bilingue chez Concentrix, et il gère les réunions et la communication client sur Epistemia." },
  { re: /\b(team ?player|team ?work|team spirit|collaborat\w*|works? (?:well )?(?:in|within|as part of) (?:a )?teams?|esprit d equipe|travail (?:en|d) equipe|travailler en equipe)\b/g,
    status: "direct", ids: ["fact:soft-skills", "quest:connect", "log:hec-finance-academy"],
    en: "Most of his projects are team projects, e.g. IHEC Connect over 4 Scrum sprints, plus years of student-club work.",
    fr: "La plupart de ses projets sont des projets d'équipe, par ex. IHEC Connect en 4 sprints Scrum, plus des années de vie associative." },
  { re: /\b(leadership|team lead(?:ership)?|leading teams?|lead(?:s)? (?:a )?teams?|encadrement|management d equipe)\b/g,
    status: "direct", ids: ["fact:soft-skills", "cert:hecfa-lead", "quest:epistemia"],
    en: "Elected co-head of the IT department at HEC Finance Academy and project manager on several team projects.",
    fr: "Co-responsable élu du pôle IT de HEC Finance Academy et chef de projet sur plusieurs projets d'équipe." },
  { re: /\b(public speaking|presentation(?:s| skills)?|presenting|pitch(?:ing|es)?|prise de parole(?: en public)?|aisance (?:a l )?oral(?:e)?)\b/g,
    status: "direct", ids: ["fact:soft-skills", "quest:connect", "cert:injaz"],
    en: "Pitched IHEC Connect to 1st prize at Global Entrepreneurship Week; 3rd prize at the INJAZ bootcamp, which covered pitching.",
    fr: "A présenté IHEC Connect jusqu'au 1er prix de la Global Entrepreneurship Week ; 3e prix au bootcamp INJAZ, qui couvrait le pitch." },
  { re: /\b(under pressure|pressure|stress(?:ful)?|tight deadlines?|deadlines?|fast paced(?: environment)?|sous pression|gestion du stress|respect des delais|delais serres)\b/g,
    status: "direct", ids: ["fact:soft-skills", "fact:awards", "quest:codelab"],
    en: "3 competition podiums, and his department's software ran the 220-participant CodeLab 2.0 hackathon live, delivered on a deadline.",
    fr: "3 podiums en compétition, et le logiciel de son pôle a fait tourner en direct un hackathon de 220 participants, livré dans les délais." },
  { re: /\b(project management|gestion de projets?|agile(?: methodolog(?:y|ies))?|scrum|methodes agiles)\b/g,
    status: "direct", ids: ["skill:project-management", "quest:epistemia", "quest:connect"],
    en: "Project manager on Epistemia, IHEC Connect (4 Scrum sprints), the BVMT Trading Assistant and RideShare.",
    fr: "Chef de projet sur Epistemia, IHEC Connect (4 sprints Scrum), le BVMT Trading Assistant et RideShare." },
  { re: /\b(problem solving|solving problems|resolution de problemes|troubleshooting)\b/g,
    status: "direct", ids: ["log:concentrix", "skill:client-support"],
    en: "16 months resolving Uber merchants' cases as a technical support agent at Concentrix.",
    fr: "16 mois à résoudre les dossiers des marchands Uber comme agent de support technique chez Concentrix." },
  { re: /\b(autonom\w*|independent(?:ly)?|self starter|self motivated|ownership|initiative|proactiv\w*)\b/g,
    status: "direct", ids: ["log:kalori", "quest:platform"],
    en: "He built and runs Kalori on his own as founder and sole developer, and is building its data platform solo.",
    fr: "Il a créé et fait tourner Kalori seul, comme fondateur et unique développeur, et construit seul sa plateforme de données." },
  { re: /\b(fast learner|quick learner|learns? (?:fast|quickly)|eager to learn|willingness to learn|curiosity|curious|apprend\w* (?:vite|rapidement)|curiosite|capacite d apprentissage)\b/g,
    status: "direct", ids: ["quest:platform", "skill:microsoft-fabric"],
    en: "He is learning the data-platform stack (Kafka, Fabric, PySpark) by building it now.",
    fr: "Il apprend la stack de la plateforme de données (Kafka, Fabric, PySpark) en la construisant en ce moment." },
  // Languages, at the level the portfolio gives (from the Concentrix recruitment test), never "fluent".
  { re: /\b(?:native|mother tongue|langue maternelle)\s+(?:english|anglais|french|francais)\b|\b(?:english|anglais|french|francais)\s+(?:native(?: speaker)?|langue maternelle)\b/g,
    status: "adjacent", ids: ["fact:languages"],
    en: "Native level is not stated: English C1 and French B2, from the Concentrix recruitment test.",
    fr: "Le niveau natif n'est pas indiqué : anglais C1 et français B2, selon le test de recrutement Concentrix." },
  { re: /\b(english|anglais)\b/g, status: "direct", ids: ["fact:languages", "log:concentrix"],
    en: "English C1 (Concentrix recruitment test), used daily for 16 months of client support.",
    fr: "Anglais C1 (test de recrutement Concentrix), utilisé au quotidien pendant 16 mois de support client." },
  { re: /\b(french|francais)\b/g, status: "direct", ids: ["fact:languages", "log:concentrix"],
    en: "French B2 (Concentrix recruitment test), used daily for 16 months of client support.",
    fr: "Français B2 (test de recrutement Concentrix), utilisé au quotidien pendant 16 mois de support client." },
  { re: /\b(arabic|arabe)\b/g, status: "direct", ids: ["fact:languages"], en: "Arabic is his native language.", fr: "L'arabe est sa langue maternelle." },
  { re: /\b(bilingual|bilingue|multilingual|multilingue)\b/g, status: "direct", ids: ["fact:languages", "log:concentrix"],
    en: "Arabic native, English C1, French B2; 16 months of bilingual (French, English) support at Concentrix.",
    fr: "Arabe natif, anglais C1, français B2 ; 16 mois de support bilingue (français, anglais) chez Concentrix." },
  { re: /\b(german|allemand|spanish|espagnol|italian|italien|chinese|mandarin|chinois|dutch|neerlandais|portuguese|portugais|japanese|japonais|russian|russe|turkish|turc)\b/g,
    status: "gap", ids: [], en: "This language is not on the portfolio (Arabic, English C1, French B2).",
    fr: "Cette langue n'apparaît pas sur le portfolio (arabe, anglais C1, français B2)." }
];
const SOFT_FILLER = new Set([...FILLER].map(deaccent).concat(("excellent great very highly good strong solid outstanding effective ability able capacity " +
  "capable written verbal oral spoken writing speaking both fluent fluency fluently courant courante professional professionnel business level " +
  "niveau environment environnement speaker speakers capacites ecrite ecrites orale orales aptitude aptitudes with others well work works working team teams thrive in of to a an and or the skills skill excellente " +
  "bonne bon tres grande sens du de des d l le la et ou en avec forte fort aisance capacite qualites qualite esprit is are be").split(" ")));
const RANK = { gap: 0, adjacent: 1, direct: 2 };
function softEvidence(req) {
  let text = " " + deaccent(req).replace(/[^a-z0-9 ]+/g, " ") + " ";
  if (/\d/.test(text)) {
    // "Leading teams of 10+", "managed 5 people": he has led teams, but no team size is stated anywhere.
    const lead = SOFT[3];
    lead.re.lastIndex = 0;
    if (!/\d+\s*\+?\s*(years?|yrs?|ans?|annees?)\b/.test(text) && (lead.re.test(text) || /\b(manag\w*|lead\w*|encadr\w*)\b[^.]{0,30}\b(people|persons|engineers|developers|personnes|teams?|equipes?)\b/.test(text)))
      return { status: "adjacent", ids: lead.ids, text: { en: "Team sizes are not stated on the portfolio. " + lead.en, fr: "La taille des équipes n'est pas indiquée sur le portfolio. " + lead.fr } };
    return null; // years, scores: the model decides
  }
  const hits = [];
  for (const s of SOFT) {
    s.re.lastIndex = 0;
    if (s.re.test(text)) { hits.push(s); text = text.replace(s.re, " "); }
  }
  if (!hits.length) return null;
  if (text.split(/\s+/).some((w) => w && !SOFT_FILLER.has(w))) return null;
  const either = /\b(or|ou)\b/.test(deaccent(req));
  const pick = either ? Math.max(...hits.map((h) => RANK[h.status])) : Math.min(...hits.map((h) => RANK[h.status]));
  const status = Object.keys(RANK).find((k) => RANK[k] === pick);
  const counted = hits.filter((h) => !either || RANK[h.status] === pick);
  const ids = [...new Set(counted.flatMap((h) => h.ids))].slice(0, 4);
  const notes = [...new Set(counted.map((h) => h))].slice(0, 2);
  return { status, ids, text: { en: notes.map((h) => h.en).join(" "), fr: notes.map((h) => h.fr).join(" ") } };
}

export function scoreMatch(raw, lang = "en") {
  const reqs = (Array.isArray(raw?.requirements) ? raw.requirements : []).slice(0, 14).map((r) => {
    let evidence = (Array.isArray(r.evidence) ? r.evidence : []).map((x) => String(x).toLowerCase().replace(/^\[|\]$/g, "")).filter((x) => ID_SET.has(x)).slice(0, 4);
    let status = ["direct", "adjacent", "gap"].includes(r.status) ? r.status : "gap";
    let note = r.note;
    const known = softEvidence(r.req) || toolEvidence(r.req);
    if (known) {
      // Fixed evidence, so the strength (and the score) does not depend on what the model cited.
      evidence = known.ids.filter((id) => ID_SET.has(id));
      const fr = lang === "fr";
      if (known.text) note = known.text[fr ? "fr" : "en"];
      else if (known.note) note = ADJ_NOTE[known.note][fr ? "fr" : "en"];
      else if (known.status === "gap") note = fr ? "Aucune durée d'expérience avec cet outil n'est indiquée sur le portfolio." : "The portfolio shows no years of experience with this tool.";
      else if (status !== "direct") note = "";
      status = known.status;
    }
    if (status !== "gap" && evidence.length === 0) status = "gap"; // a claim without real evidence does not count
    // The model sometimes under-rates: a requirement that names the very skill it cites is a direct match.
    const key = String(r.req || "").toLowerCase().replace(/#/g, "sharp").replace(/[+]/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!known && status === "adjacent" && key && evidence.some((id) => id.startsWith("skill:") && (id.slice(6) === key || key.endsWith("-" + id.slice(6)) || id.slice(6).endsWith("-" + key)))) status = "direct";
    return {
      req: clean(r.req, 120), priority: r.priority === "must" ? "must" : "nice", status,
      evidence: status === "gap" ? [] : evidence, note: sanitizeReply(clean(note, 300)) ?? ""
    };
  }).filter((r) => r.req);
  let got = 0, total = 0;
  for (const r of reqs) {
    const w = r.priority === "must" ? 2 : 1;
    total += w;
    if (r.status === "direct") got += w * strength(r.evidence);
    else if (r.status === "adjacent") got += w * 0.7 * strength(r.evidence); // generous, still below a direct match
  }
  let score = total ? Math.round((got / total) * 100) : 0;
  if (score >= 100 && reqs.some((r) => r.status !== "direct")) score = 99;
  return {
    score, verdict: clean(raw?.verdict, 60), requirements: reqs,
    pitch: sanitizeReply(clean(raw?.pitch, 1200)) ?? ""
  };
}
