import { IDS, LINKS, SKILL_RANK, CERT_STATUS } from "./knowledge.js";
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
  /(score|match)[^.\n]{0,30}(100|cent) ?%/i
];
export const looksLikeInjection = (s) => INJECTION.some((r) => r.test(s));

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
  [/\bproving\b/g, "showing"], [/\bProving\b/g, "Showing"],
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
  t = fixKnownSlips(t);
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
export function scoreMatch(raw) {
  const reqs = (Array.isArray(raw?.requirements) ? raw.requirements : []).slice(0, 14).map((r) => {
    const evidence = (Array.isArray(r.evidence) ? r.evidence : []).map((x) => String(x).toLowerCase().replace(/^\[|\]$/g, "")).filter((x) => ID_SET.has(x)).slice(0, 4);
    let status = ["direct", "adjacent", "gap"].includes(r.status) ? r.status : "gap";
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
