const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const navigation = document.querySelector("[data-nav]");
if (header && menu && navigation) {
  header.classList.add("js-ready");
  menu.addEventListener("click", () => { const open = header.classList.toggle("is-open"); menu.setAttribute("aria-expanded", String(open)); });
  navigation.addEventListener("click", (event) => { if (event.target.closest("a")) { header.classList.remove("is-open"); menu.setAttribute("aria-expanded", "false"); } });
}

const observation = document.querySelector(".observation");
if (observation && !observation.querySelector(".archive-bridge")) {
  const bridge = document.createElement("div");
  bridge.className = "archive-bridge";
  bridge.innerHTML = '<span>PUBLIC RESEARCH</span><a href="studies/">Research archive <b>↗</b></a>';
  observation.appendChild(bridge);
}

const fields = {
  conclusion:["01","The exact claim under pressure.","A sentence precise enough that evidence can support it, fail it, or leave it unresolved. ‘The release is safe’ is too broad; ‘maintainers authorized release X’ can be tested.","maintainers authorized release X"],
  dimension:["02","The kind of inference being tested.","Authorization, attribution, completeness and consequence are different questions. One study freezes one primary dimension rather than hiding several inside a vague claim.","authorization"],
  focal_record:["03","The genuine artifact being interpreted.","The record must be named exactly: a signed attestation, an audit event, a trace or another artifact with its own native verification procedure.","attestation.intoto.jsonl"],
  validity_condition:["04","What makes the record valid on its own terms.","A native check is frozen before collection. Invalid records do not become evidence of insufficiency; they make the study invalid.","signature and subject digest verify"],
  ground_truth:["05","Independent knowledge of what actually happened.","Controlled, owned experiments establish intent, actor, captured set or consequence separately from the focal record being evaluated.","maintainer did not authorize release X"],
  inference:["06","The rule connecting record to conclusion.","The inferential step is written down, not smuggled in through prose. This is the exact bridge the study tries to falsify.","valid signer identity implies authorization"],
  retrievable_signals:["07","What an investigator can actually recover.","Declared public or authorized signals are collected under a frozen method. Hidden access is not silently treated as ordinary evidence.","identity, workflow path, subject digest"],
  missingness_states:["08","Why expected evidence is absent.","Absent, unsupported, expired, denied, not enabled and out of scope are different states. Collapsing them invents certainty.","authorization intent: not represented"],
  verdict:["09","The narrow result the evidence earns.","Only four verdicts are permitted: SUFFICIENT, INSUFFICIENT, NOT_SEPARABLE or INVALID. The verdict never outruns the frozen conclusion.","INSUFFICIENT"]
};
const tuple = document.querySelector("[data-tuple]");
if (tuple) tuple.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-field]"); if (!button) return;
  const field = fields[button.dataset.field]; tuple.querySelectorAll("button").forEach(item => item.classList.remove("is-active")); button.classList.add("is-active");
  document.querySelector("[data-field-count]").textContent = `${field[0]} / 09`; document.querySelector("[data-field-key]").textContent = button.dataset.field; document.querySelector("[data-field-title]").textContent = field[1]; document.querySelector("[data-field-copy]").textContent = field[2]; document.querySelector("[data-field-example]").textContent = field[3];
});

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll("[data-reveal]");
if (reduced || !("IntersectionObserver" in window)) revealItems.forEach(item => item.classList.add("is-visible"));
else {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6%" });
  revealItems.forEach(item => observer.observe(item));
}

const evidence = document.querySelector("[data-evidence]");
const plane = document.querySelector("[data-plane]");
if (evidence && plane && !reduced) {
  evidence.addEventListener("pointermove", event => {
    const box = evidence.getBoundingClientRect(); const nx = (event.clientX - box.left) / box.width; const ny = (event.clientY - box.top) / box.height;
    plane.style.setProperty("--tilt-x", `${(nx - .5) * 2.2}deg`); plane.style.setProperty("--tilt-y", `${(.5 - ny) * 1.6}deg`);
    plane.querySelectorAll("[data-node]").forEach(node => { const r = node.getBoundingClientRect(); const dx = event.clientX - (r.left + r.width/2); const dy = event.clientY - (r.top + r.height/2); node.classList.toggle("is-near", Math.hypot(dx,dy) < 105); });
  });
  evidence.addEventListener("pointerleave", () => { plane.style.setProperty("--tilt-x","0deg"); plane.style.setProperty("--tilt-y","0deg"); plane.querySelectorAll("[data-node]").forEach(node => node.classList.remove("is-near")); });
}
