// Builds the recruiter agent's grounding dossier from the portfolio itself.
// Run after editing content in index.html or the CV:  node scripts/build-knowledge.mjs
// Output: functions/_lib/knowledge.js (committed; Cloudflare Pages bundles it, no build step on deploy).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

// The content consts sit between "const MENU" and the language block; they need no DOM.
const start = html.indexOf("const MENU = [");
const end = html.indexOf("const LANG_KEY");
if (start < 0 || end < 0) throw new Error("Could not find the content block in index.html");
const data = vm.runInNewContext(
  html.slice(start, end) + "\n;({ STATUS, QUESTS, CERTS, RANKS, SKILLS, LOG, CAL, UI });",
  {}
);

// Same slug rule as nox/nox.js (skill ids).
const slug = (s) => s.toLowerCase().replace(/#/g, "sharp").replace(/[+]/g, "plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const plain = (s) => String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const ids = [];
const links = new Set(["https://aziz-ghazouani.pages.dev", "mailto:aziz19ghazouani@gmail.com",
  "https://www.linkedin.com/in/aziz-ghazouani/", "https://github.com/AzizGh69", "https://kalori-app.com"]);
const rankOf = {};   // skill id -> rank letter (used for scoring)
const certStatus = {}; // cert id -> earned | prep
const out = [];
const add = (id) => { ids.push(id); return `[${id}]`; };
// Lines only in the full chat dossier; the job-match dossier leaves them out to fit free-tier token limits.
const full = (line) => out.push({ full: line });

const { UI } = data;
out.push("## PROFILE");
out.push(`${add("fact:profile")} Mohamed Aziz Ghazouani. ${plain(UI.en.tagline)}`);
out.push("Based in Ben Arous (Tunis area), Tunisia. Contact: aziz19ghazouani@gmail.com · LinkedIn https://www.linkedin.com/in/aziz-ghazouani/ · GitHub https://github.com/AzizGh69 · Portfolio https://aziz-ghazouani.pages.dev");
full("About:");
UI.en.about.forEach((p) => full("- " + plain(p)));
out.push("");
out.push("## FACTS");
for (const [dt, ...dds] of UI.en.facts) {
  const id = add("fact:" + slug(dt));
  out.push(`${id} ${dt}: ` + dds.map(([m, n]) => `${plain(m)} (${plain(n)})`).join("; "));
}
out.push("");
out.push("## AVAILABILITY");
out.push(`${add("fact:availability")} Looking for a 4–6 month final-year internship (PFE) from 02/2027 in data engineering, AI or product (data, AI and product roles). Graduation expected 06/2027. NOT stated anywhere in the portfolio: remote vs on-site preference, relocation, salary, visa or work permit. Never say any of these is fine, possible or acceptable; say Aziz will answer that by email.`);
out.push("");
out.push("## CURRENT STATUS");
data.STATUS.forEach((s) => full(`- ${s.k}: ${s.v} — ${s.meta}`));
out.push("");

out.push("## EXPERIENCE");
data.LOG.forEach((e) => {
  const id = add("log:" + slug(e.org.split("·")[0]));
  out.push(`${id} ${e.title} — ${e.org} — ${e.when} (${e.dur})`);
  e.points.forEach((p) => out.push("  - " + plain(p)));
});
out.push("");

out.push("## PROJECTS (portfolio 'quests')");
data.QUESTS.forEach((q) => {
  const id = add("quest:" + q.id);
  out.push(`${id} ${q.title} — ${q.kind} — ${q.when} — status: ${q.statusLabel || q.status}`);
  out.push(`  Role: ${q.role} · Team: ${q.team}`);
  out.push(`  Objective: ${plain(q.obj)}`);
  (q.results || []).forEach((r, i) => (i < 2 ? out.push("  - " + plain(r)) : full("  - " + plain(r))));
  if (q.stack?.length) out.push(`  Stack: ${q.stack.join(", ")}`);
  const proof = (q.proof || []).filter((p) => p.href);
  proof.forEach((p) => links.add(p.href));
  if (proof.length) full(`  Proof: ${proof.map((p) => `${p.label} (${p.href})`).join(", ")}`);
});
out.push("");

out.push("## SKILLS (evidence level, not self-rating)");
out.push("Levels: " + Object.entries(data.RANKS).map(([k, r]) => `${k}=${r.l} (${r.d})`).join("; "));
data.SKILLS.forEach((g) => {
  out.push(`${g.g}: ` + g.items.map(([name, r]) => {
    const id = "skill:" + slug(name);
    rankOf[id] = r;
    return `${add(id)} ${name} (${r})`;
  }).join(", "));
});
out.push("");

out.push("## CERTIFICATIONS & RECOGNITION");
data.CERTS.forEach((c) => {
  const id = add("cert:" + c.id);
  certStatus[id] = c.status;
  const st = c.status === "prep" ? "IN PREPARATION (not yet earned)" : (c.statusLabel || "earned");
  out.push(`${id} ${c.title} — ${c.issuer} — ${c.date} — ${c.group === "rec" ? "recognition" : c.type} — ${st}`);
  if (c.blurb) full(`  ${plain(c.blurb)}`);
  if (c.covers?.length) out.push(`  Covers: ${c.covers.join(", ")}`);
  (c.links || []).filter((l) => l.href).forEach((l) => links.add(l.href));
});
out.push("");


// From the CV, only what the portfolio does not already say: education details and the full skills list.
// (Groq's free tier allows ~8k tokens per minute, so the dossier stays lean. No phone number.)
const cvLines = readFileSync(join(root, "cv/source/Mohamed-Aziz-Ghazouani-CV.txt"), "utf8").split(/\r?\n/);
const section = (name) => {
  const i = cvLines.findIndex((l) => l.trim() === name);
  if (i < 0) return [];
  const rest = cvLines.slice(i + 1);
  const j = rest.findIndex((l) => /^[A-Z][A-Z ,&]+$/.test(l.trim()));
  return rest.slice(0, j < 0 ? undefined : j).map((l) => l.trim()).filter(Boolean);
};
out.push("## CV EXTRACTS");
out.push(add("cv") + " Education: " + section("EDUCATION").join(" · "));
out.push("CV skills list: " + section("SKILLS").join(" | "));
out.push("CV languages & involvement: " + section("CERTIFICATIONS, LANGUAGES & INVOLVEMENT").join(" | "));

const text = out.map((l) => (typeof l === "string" ? l : l.full)).join("\n");
const lean = out.filter((l) => typeof l === "string").join("\n");
const file = join(root, "functions/_lib/knowledge.js");
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file,
  "// GENERATED by scripts/build-knowledge.mjs from index.html and the CV. Do not edit by hand.\n" +
  `export const KNOWLEDGE = ${JSON.stringify(text)};\n` +
  `export const KNOWLEDGE_LEAN = ${JSON.stringify(lean)};\n` +
  `export const IDS = ${JSON.stringify(ids)};\n` +
  `export const SKILL_RANK = ${JSON.stringify(rankOf)};\n` +
  `export const CERT_STATUS = ${JSON.stringify(certStatus)};\n` +
  `export const LINKS = ${JSON.stringify([...links])};\n`);
console.log(`knowledge.js: ${text.length} chars (lean ${lean.length}), ${ids.length} ids, ${links.size} links`);
