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
const toolKey = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9#+.àâçéèêëîïôûù-]+/g, " ").trim();
function toolEvidence(req) {
  const text = toolKey(req);
  if (!text || /\d+\s*\+?\s*(years?|yrs?|ans?|années?)\b/.test(text)) return null;
  const keys = Object.keys(TOOLS).filter((k) => !NOT_TOOLS.has(k) && k.length >= 2)
    .filter((k) => new RegExp(`(^|[^a-z0-9#+.])${k.replace(/[.+#]/g, "\\$&")}($|[^a-z0-9#+])`).test(text))
    .sort((a, b) => b.length - a.length);
  if (!keys.length) return null;
  let rest = " " + text + " ";
  for (const k of keys) rest = rest.split(k).join(" ");
  const left = rest.split(/[\s,/&.-]+/).filter((w) => w && !FILLER.has(w));
  if (left.length) return null;
  const ids = [...new Set(keys.flatMap((k) => TOOLS[k]))];
  return ids.sort((a, b) => (a.startsWith("skill:") ? 0 : 1) - (b.startsWith("skill:") ? 0 : 1)).slice(0, 4);
}

export function scoreMatch(raw) {
  const reqs = (Array.isArray(raw?.requirements) ? raw.requirements : []).slice(0, 14).map((r) => {
    const evidence = (Array.isArray(r.evidence) ? r.evidence : []).map((x) => String(x).toLowerCase().replace(/^\[|\]$/g, "")).filter((x) => ID_SET.has(x)).slice(0, 4);
    let status = ["direct", "adjacent", "gap"].includes(r.status) ? r.status : "gap";
    const known = toolEvidence(r.req);
    if (known) { status = "direct"; for (const id of known) if (!evidence.includes(id) && evidence.length < 4) evidence.push(id); }
    if (status !== "gap" && evidence.length === 0) status = "gap"; // a claim without real evidence does not count
    // The model sometimes under-rates: a requirement that names the very skill it cites is a direct match.
    const key = String(r.req || "").toLowerCase().replace(/#/g, "sharp").replace(/[+]/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (status === "adjacent" && key && evidence.some((id) => id.startsWith("skill:") && (id.slice(6) === key || key.endsWith("-" + id.slice(6)) || id.slice(6).endsWith("-" + key)))) status = "direct";
    return {
      req: clean(r.req, 120), priority: r.priority === "must" ? "must" : "nice", status,
      evidence: status === "gap" ? [] : evidence, note: sanitizeReply(clean(r.note, 300)) ?? ""
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
