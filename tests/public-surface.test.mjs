import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const bytes = (path) => readFileSync(new URL(`../${path}`, import.meta.url));
const gitBlobSha = (buffer) => createHash("sha1").update(`blob ${buffer.length}\0`).update(buffer).digest("hex");
const home = read("index.html");
const siteJs = read("site.js");
const flagship = read("flagship.css");
const corpus = read("studies/index.html");
const r002 = read("studies/audit-retrieval.html");
const s001 = read("studies/decision-invariance.html");
const studyCss = read("studies/study.css");
const continuityCss = read("studies/continuity.css");
const sitemap = read("sitemap.xml");
const surfaceLock = JSON.parse(read("surface-lock.json"));

const hero = home.match(/<section class="hero[^>]*>[\s\S]*?<\/section>/)?.[0] ?? "";

test("matches the canonical publication lock", () => {
  for (const [path, expected] of Object.entries(surfaceLock.locked)) {
    assert.equal(gitBlobSha(bytes(path)), expected, `${path} drifted from the canonical publication surface`);
  }
  assert.deepEqual(Object.keys(surfaceLock.unlocked), ["styles.css"]);
});

test("publishes the bounded flagship thesis", () => {
  assert.match(home, /The record<br>can be <em>true\.<\/em>/);
  assert.match(home, /The conclusion can still be false\./);
  assert.match(home, /Foundation threshold not yet earned\./);
  assert.doesNotMatch(home, /Foundation established|proven framework/i);
});

test("keeps the flagship visual explicitly illustrative", () => {
  assert.ok(hero);
  assert.match(hero, /CLAIM GRAPH \/ STATIC MODEL/);
  assert.match(hero, /VERIFIED <span>≠<\/span> ESTABLISHED/);
  assert.doesNotMatch(hero, /\bLIVE\b|real[- ]time telemetry|currently observing/i);
  assert.match(flagship, /boundary-breathe/);
});

test("publishes the full presentation without JavaScript", () => {
  assert.match(home, /<link rel="stylesheet" href="styles\.css"><link rel="stylesheet" href="flagship\.css">/);
  assert.doesNotMatch(siteJs, /createElement\(["']link["']\)|flagship\.css|v2\.css/);
});

test("publishes complete organization and sharing metadata", () => {
  for (const property of ["og:title", "og:description", "og:image", "og:image:width", "og:image:height"]) assert.match(home, new RegExp(`property="${property}"`));
  assert.match(home, /"@type":"ResearchOrganization"/);
  assert.match(home, /name="twitter:card" content="summary_large_image"/);
});

test("publishes a deliberate path into the research corpus", () => {
  assert.match(siteJs, /Research archive/);
  assert.match(corpus, /Evidence,<br><span>under pressure\.<\/span>/);
  assert.match(corpus, /INFERENCE \/ STATIC MODEL/);
  assert.match(corpus, /href="audit-retrieval\.html"/);
  assert.match(corpus, /href="decision-invariance\.html"/);
  assert.doesNotMatch(corpus, /VERIFIED<\/span><b>03|INFERRED<\/span><b[^>]*>01/);
});

test("keeps archive and publications inside one visual identity", () => {
  for (const page of [corpus, r002, s001]) assert.match(page, /href="continuity\.css"/);
  assert.match(continuityCss, /\.brand::before\{content:"G\/"/);
  assert.match(continuityCss, /surface-in/);
  assert.match(continuityCss, /prefers-reduced-motion:reduce/);
});

test("keeps publication discovery attached to the corpus", () => {
  assert.match(continuityCss, /CORPUS \/ CONTINUE/);
  assert.match(continuityCss, /RESEARCH INDEX/);
  assert.match(continuityCss, /ADJACENT \/ S-001/);
  assert.match(continuityCss, /ADJACENT \/ R-002/);
  assert.match(r002, /href="decision-invariance\.html">S-001 →<\/a>/);
  assert.match(s001, /href="audit-retrieval\.html">R-002 →<\/a>/);
});

test("publishes distinct evidence states for R-002 and S-001", () => {
  assert.match(r002, /class="state-held">accepted<\/b>/);
  assert.match(r002, /RETRIEVAL <span>≠<\/span> ABSENCE/);
  assert.match(s001, /class="state-open">no verdict<\/b>/);
  assert.match(s001, /No empirical finding is claimed/);
  assert.match(s001, /see → attribute → retrieve/);
  assert.doesNotMatch(s001, /find → cross → prove/i);
});

test("publishes provenance and responsive study treatment", () => {
  for (const page of [r002, s001]) {
    assert.match(page, /class="provenance" aria-label="Publication provenance"/);
    assert.match(page, /property="og:type" content="article"/);
  }
  assert.match(studyCss, /\.provenance\{/);
  assert.match(studyCss, /prefers-reduced-motion:reduce/);
});

test("publishes every public research route in the sitemap", () => {
  for (const route of ["/", "/studies/", "/studies/audit-retrieval.html", "/studies/decision-invariance.html"]) {
    assert.match(sitemap, new RegExp(`https://ghalvera\\.github\\.io${route.replaceAll("/", "\\/")}`));
  }
});