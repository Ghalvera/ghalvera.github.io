import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const bytes = (path) => readFileSync(new URL(path, import.meta.url));
const gitBlobSha = (buffer) => createHash("sha1").update(`blob ${buffer.length}\0`).update(buffer).digest("hex");
const html = read("../index.html");
const css = read("../styles.css");
const js = read("../site.js");
const record = read("../studies/index.html");
const r002 = read("../studies/audit-retrieval.html");
const s001 = read("../studies/decision-invariance.html");
const studyCss = read("../studies/study.css");
const continuityCss = read("../studies/continuity.css");
const recordCss = read("../studies/record.css");
const favicon = read("../favicon.svg");
const sitemap = read("../sitemap.xml");
const surfaceLock = JSON.parse(read("../surface-lock.json"));

const expectedLockedPaths = [
  "assets/fonts/OFL-DM-Mono.txt",
  "assets/fonts/OFL-Inter.txt",
  "assets/fonts/OFL-Newsreader.txt",
  "assets/fonts/dm-mono-latin.woff2",
  "assets/fonts/inter-latin.woff2",
  "assets/fonts/newsreader-display-300.woff2",
  "assets/fonts/newsreader-text-300.woff2",
  "favicon.svg",
  "index.html",
  "og.png",
  "robots.txt",
  "site.js",
  "sitemap.xml",
  "styles.css",
  "studies/audit-retrieval.html",
  "studies/continuity.css",
  "studies/decision-invariance.html",
  "studies/index.html",
  "studies/record.css",
  "studies/study.css",
].sort();

function walkRules(source, atRules = []) {
  const cleaned = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  let cursor = 0;
  while (cursor < cleaned.length) {
    const open = cleaned.indexOf("{", cursor);
    if (open === -1) break;
    const prelude = cleaned.slice(cursor, open).trim();
    let depth = 1;
    let quote = null;
    let index = open + 1;
    for (; index < cleaned.length && depth; index += 1) {
      const char = cleaned[index];
      if (quote) {
        if (char === quote && cleaned[index - 1] !== "\\") quote = null;
      } else if (char === "\"" || char === "'") quote = char;
      else if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
    }
    assert.equal(depth, 0, `unclosed CSS block near ${prelude}`);
    const body = cleaned.slice(open + 1, index - 1);
    if (/^@(media|supports|layer|container)\b/.test(prelude)) rules.push(...walkRules(body, [...atRules, prelude]));
    else if (!prelude.startsWith("@")) rules.push({ selector: prelude, body, atRules });
    cursor = index;
  }
  return rules;
}

function splitSelectors(selector) { return selector.split(/,(?![^\[]*\])/).map((part) => part.trim()).filter(Boolean); }
function hidesContent(body) { return /(?:display\s*:\s*none|opacity\s*:\s*0(?:\.0+)?|visibility\s*:\s*hidden|content-visibility\s*:\s*hidden)/i.test(body); }

const rules = walkRules(css);

test("walks nested and grouped CSS rules used by the no-JavaScript guard", () => {
  const fixture = "@media(max-width:760px){.placeholder,.site-header nav{display:none}}";
  assert.deepEqual(walkRules(fixture), [{ selector: ".placeholder,.site-header nav", body: "display:none", atRules: ["@media(max-width:760px)"] }]);
  assert.deepEqual(splitSelectors(".placeholder,.site-header nav"), [".placeholder", ".site-header nav"]);
});

test("locks every byte-bearing public payload file and documents the self-lock exception", () => {
  assert.deepEqual(Object.keys(surfaceLock.locked).sort(), expectedLockedPaths);
  for (const [path, expected] of Object.entries(surfaceLock.locked)) {
    assert.equal(gitBlobSha(bytes(`../${path}`)), expected, `${path} changed without refreshing the publication lock`);
  }
  assert.deepEqual(surfaceLock.unlocked, {
    "surface-lock.json": "Self-referential manifest; payload membership is guarded but its bytes cannot hash themselves.",
  });
});

test("uses one canonical flagship stylesheet", () => {
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((match) => match[1]), ["styles.css"]);
  assert.doesNotMatch(html, /flagship\.css|v2\.css|tempered-preview|institutional-preview|black-institute-preview/);
  assert.doesNotMatch(js, /createElement\(["']link["']\)|insertRule|style\.cssText/);
});

test("keeps the institute monochrome and typography-led", () => {
  for (const font of ["NewsreaderDisplay", "NewsreaderText", "Inter", "DMMono"]) assert.match(css, new RegExp(`font-family:${font}`));
  for (const source of [css, studyCss, continuityCss, recordCss]) {
    for (const match of source.matchAll(/#([0-9a-f]{3,8})\b/gi)) { const h = match[1].length === 3 ? match[1].split("").map((x) => x + x).join("") : match[1].slice(0, 6); const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); assert.ok(Math.max(...rgb) - Math.min(...rgb) <= 12, `chromatic color ${match[0]}`); }
    for (const match of source.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)) { const rgb = match.slice(1, 4).map(Number); assert.ok(Math.max(...rgb) - Math.min(...rgb) <= 12, `chromatic color ${match[0]}`); }
  }
  for (const source of [html, favicon]) { for (const hex of source.matchAll(/#[0-9a-f]{6}\b/gi)) { const rgb=[0,2,4].map(i=>parseInt(hex[0].slice(i+1,i+3),16)); assert.ok(Math.max(...rgb)-Math.min(...rgb)<=12, `chromatic identity color ${hex[0]}`); } }
  assert.match(html, /SECURITY RESEARCH AND ENGINEERING/);
  assert.match(html, /We test what digital evidence can actually prove\./);
  assert.match(html, /The record can be true\. <span>The conclusion can still be false\.<\/span>/);
  assert.doesNotMatch(html, /real[- ]time|telemetry|dashboard|particle|manifesto/i);
});

test("ships deliberate dark and light themes with persistence", () => {
  assert.match(html, /name="color-scheme" content="dark light"/);
  assert.match(html, /data-theme-toggle/);
  assert.match(html, /aria-label="Switch to light theme"/);
  assert.match(css, /light-dark\(#f1efe9,#090a0b\)/);
  assert.match(css, /:root\[data-theme="light"\]/);
  assert.match(js, /localStorage\.getItem\("ghalvera-theme"\)/);
  assert.match(js, /localStorage\.setItem\("ghalvera-theme", nextTheme\)/);
  assert.match(js, /prefers-color-scheme: light/);
  assert.match(html, /localStorage\.getItem\("ghalvera-theme"\)/);
  const og = bytes("../og.png"); assert.deepEqual([...og.subarray(0, 8)], [137,80,78,71,13,10,26,10]); assert.equal(og.readUInt32BE(16), 1200); assert.equal(og.readUInt32BE(20), 630);
});

test("renders all primary content without JavaScript", () => {
  assert.doesNotMatch(html, /data-reveal|<noscript>/);
  assert.doesNotMatch(css, /\[data-reveal\]/);
  assert.match(html, /<nav id="primary-nav"[^>]*data-nav>/);
  const navHides = rules.filter(({ selector, body }) => splitSelectors(selector).some((part) => /(?:#primary-nav|(?:\.site-header(?:[^,{]*)\s+)?nav\b)/.test(part)) && /display\s*:\s*none/.test(body));
  assert.ok(navHides.length > 0, "enhanced mobile navigation needs a closed state");
  for (const rule of navHides) for (const part of splitSelectors(rule.selector)) if (/\.site-header(?:[^,{]*)\s+nav/.test(part)) assert.match(part, /\.js-ready/, `navigation hide must be gated on JavaScript readiness: ${part}`);
  for (const { selector, body } of rules) {
    for (const part of splitSelectors(selector)) {
      if (/(?:#primary-nav|(?:\.site-header(?:[^,{]*)\s+)?nav\b)/.test(part) && /display\s*:\s*none/.test(body)) assert.match(part, /(?:^|\.)js-ready(?:\b|\.)/, `navigation hide must be gated on JavaScript readiness: ${part}`);
      if (hidesContent(body) && /(^|[\s>+~.#:(])(main|section|\.hero|\.mission|\.research|\.featured|\.method|\.engineering|\.publications|\.about)(?=$|[\s>+~.#:[(])/i.test(part)) assert.fail(`primary content is hidden without an explicit progressive-enhancement contract: ${part}`);
    }
  }
});

test("keeps the homepage institutional architecture complete", () => {
  for (const id of ["top", "research", "method", "engineering", "publications", "about"]) assert.match(html, new RegExp(`id="${id}"`));
  for (const word of ["Research", "Engineering", "Publish"]) assert.match(html, new RegExp(`<h3>${word}<\\/h3>`));
  for (const area of ["Authorization", "Attribution", "Completeness", "Consequence"]) assert.match(html, new RegExp(`<h3>${area}<\\/h3>`));
  for (const step of ["See", "Attribute", "Retrieve"]) assert.match(html, new RegExp(`<h3>${step}<\\/h3>`));
  for (const tool of ["ledger", "range", "provenance", "trace-npm"]) assert.match(html, new RegExp(`>${tool}(?: |<)`));
});

test("makes R-002 the evidence-led flagship", () => {
  assert.match(html, /03 \/ FEATURED RESEARCH/);
  assert.match(html, /The evidence was there\.<br>The retrieval path could not find it\./);
  assert.match(html, /class="measure zero"><b>0<\/b><span>query matches/);
  assert.match(html, /class="measure parsed"><b>186<\/b><span>parsed records/);
  assert.match(html, /class="measure raw"><b>192<\/b><span>raw keyed lines/);
  assert.match(html, /same host \/ same moment \/ same evidence source/);
  assert.match(html, /href="studies\/audit-retrieval\.html"/);
});

test("does not promote S-001 beyond its evidence", () => {
  assert.match(html, /S-001 \/ OPEN PROTOCOL/);
  assert.match(html, /<strong>NO_VERDICT/);
  assert.match(html, /Prospective attribution protocol; no empirical finding\./);
  assert.match(s001, /protocol evidence \/ no empirical finding/);
  assert.match(s001, /No empirical finding is claimed/);
  assert.match(s001, /class="state-open">no verdict<\/b>/);
  assert.doesNotMatch(s001, /empirical finding accepted/i);
  const feature = html.match(/<a class="secondary-feature" href="studies\/decision-invariance\.html">[\s\S]*?<\/a>/)?.[0] ?? "";
  const publication = html.match(/<a href="studies\/decision-invariance\.html">[\s\S]*?<\/a>/)?.[0] ?? "";
  for (const block of [feature, publication]) { assert.match(block, /NO_VERDICT/); assert.doesNotMatch(block, /ACCEPTED|empirical finding accepted/i); }
});

test("preserves research truth, provenance, and authorization boundaries", () => {
  assert.match(html, /Every target is owned or explicitly authorized/);
  assert.match(html, /Working hypothesis; Foundation threshold not yet earned/);
  assert.match(r002, /RETROSPECTIVE MOTIVATING SPECIMEN/);
  assert.match(r002, /RETRIEVAL <span>≠<\/span> ABSENCE/);
  for (const page of [r002, s001]) {
    assert.match(page, /class="provenance" aria-label="Publication provenance"/);
    for (const label of ["study", "treatment", "claim state", "canonical"]) assert.match(page, new RegExp(`<span>${label}<\\/span>`));
  }
});

test("provides accessible progressive enhancement", () => {
  assert.match(html, /class="skip" href="#main"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="primary-nav"/);
  assert.match(html, /class="evidence-figure" role="img" aria-label=/);
  assert.match(html, /<script src="site\.js" defer><\/script>/);
  assert.doesNotMatch(html, /onclick=|tabindex="[1-9]/);
  assert.match(js, /header\.classList\.add\("js-ready"\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(studyCss, /prefers-reduced-motion:reduce/);
  assert.match(studyCss, /\.study\{overflow-x:hidden;contain:inline-size\}/);
  assert.match(studyCss, /\.study \.shell\{width:100%\}/);
  assert.match(studyCss, /\.tbl\{[^}]*overflow-x:auto/); assert.doesNotMatch(studyCss, /\.(?:finding-strip|provenance)\{[^}]*overflow-x\s*:\s*(?:hidden|clip)/);
});

test("indexes the public research corpus", () => {
  for (const url of ["https://ghalvera.github.io/", "https://ghalvera.github.io/studies/", "https://ghalvera.github.io/studies/audit-retrieval.html", "https://ghalvera.github.io/studies/decision-invariance.html"]) {
    assert.match(sitemap, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(record, /property="og:title" content="Research — Ghalvera"/);
  assert.match(record, /href="audit-retrieval\.html"/);
  assert.match(record, /href="decision-invariance\.html"/);
});
