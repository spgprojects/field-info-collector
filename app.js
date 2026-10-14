/* Field Info-Collector — schema-based picture and data collection, configured for bespoke deployment.
   Runs on a phone with no backend. Clean-room build on SPG time.

   Everything that makes a deployment bespoke lives in seed.js (or an imported JSON of the same shape):
     schema.slots   photo slots per asset
     schema.fields  data fields per asset (text | number | select | check), `required` ones count
     areas, assets  the register
   The app renders whatever the schema says. Captures and field values live in IndexedDB on the device
   until you export one zip.

   Asset status:
     GAP        nothing captured
     PARTIAL    some slots or required fields done
     COLLECTED  every slot done (or skipped with a note) and every required field filled
   The coverage report reads the register itself: missing class, missing description, duplicate tags,
   rows with no asset number. That is the part people usually discover at load time. */

const DEFAULT_SLOTS = [
  { k: 1, label: "Close-up", hint: "The component itself" },
  { k: 2, label: "Asset / tag", hint: "The tag plate or placard" },
  { k: 3, label: "Nameplate", hint: "If readable; otherwise skip with a note", skippable: true },
  { k: 4, label: "Context", hint: "Where it sits" },
  { k: 5, label: "Wide", hint: "The whole unit" },
];
const DB_NAME = "field_info_collector", STORE = "captures";
let db, reg = null, tab = "areas", current = null;
const SLOTS = () => reg?.schema?.slots?.length ? reg.schema.slots : DEFAULT_SLOTS;
const FIELDS = () => reg?.schema?.fields || [];

/* ---------- storage ---------- */
function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const tx = (mode) => db.transaction(STORE, mode).objectStore(STORE);
const get = (k) => new Promise((res) => { const q = tx("readonly").get(k); q.onsuccess = () => res(q.result); });
const put = (k, v) => new Promise((res) => { tx("readwrite").put(v, k).onsuccess = () => res(); });
const del = (k) => new Promise((res) => { tx("readwrite").delete(k).onsuccess = () => res(); });
const allKeys = () => new Promise((res) => { const q = tx("readonly").getAllKeys(); q.onsuccess = () => res(q.result); });
const clearAll = () => new Promise((res) => { tx("readwrite").clear().onsuccess = () => res(); });

async function loadRegister() {
  reg = (await get("__register")) || window.SEED;
  if (!(await get("__register"))) await put("__register", reg);
}
async function captures(assetId) {
  const out = { slots: {}, data: (await get(`${assetId}:data`)) || {} };
  for (const s of SLOTS()) out.slots[s.k] = await get(`${assetId}:${s.k}`);
  return out;
}
function statusOf(c) {
  const slots = SLOTS(), req = FIELDS().filter((f) => f.required);
  const sd = slots.filter((s) => c.slots[s.k] && (c.slots[s.k].blob || c.slots[s.k].skipped)).length;
  const fd = req.filter((f) => c.data[f.k] !== undefined && c.data[f.k] !== "" && c.data[f.k] !== false).length;
  const anyData = Object.values(c.data).some((v) => v !== "" && v !== false && v !== undefined);
  if (sd === 0 && !anyData) return "gap";
  if (sd === slots.length && fd === req.length) return "collected";
  return "partial";
}

/* ---------- placeholder drawings: a schematic per equipment kind, never a fake photo ---------- */
const DRAW = {
  vessel:     '<rect x="35" y="15" width="30" height="70" rx="15" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="20" y1="50" x2="35" y2="50" stroke="#1e3a5f" stroke-width="3"/><line x1="65" y1="50" x2="80" y2="50" stroke="#1e3a5f" stroke-width="3"/>',
  pump:       '<circle cx="50" cy="55" r="18" fill="none" stroke="#1e3a5f" stroke-width="3"/><path d="M50 37 L50 20 L75 20" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="20" y1="55" x2="32" y2="55" stroke="#1e3a5f" stroke-width="3"/>',
  compressor: '<path d="M25 30 L75 40 L75 70 L25 80 Z" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="10" y1="55" x2="25" y2="55" stroke="#1e3a5f" stroke-width="3"/><line x1="75" y1="55" x2="90" y2="55" stroke="#1e3a5f" stroke-width="3"/>',
  motor:      '<rect x="25" y="35" width="40" height="30" fill="none" stroke="#1e3a5f" stroke-width="3"/><text x="45" y="56" font-size="14" text-anchor="middle" fill="#1e3a5f" font-family="Arial">M</text><line x1="65" y1="50" x2="85" y2="50" stroke="#1e3a5f" stroke-width="3"/>',
  exchanger:  '<rect x="15" y="35" width="70" height="30" rx="15" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="15" y1="50" x2="85" y2="50" stroke="#1e3a5f" stroke-width="2" stroke-dasharray="4 3"/>',
  xmtr:       '<circle cx="50" cy="40" r="16" fill="none" stroke="#1e3a5f" stroke-width="3"/><text x="50" y="45" font-size="12" text-anchor="middle" fill="#1e3a5f" font-family="Arial">T</text><line x1="50" y1="56" x2="50" y2="80" stroke="#1e3a5f" stroke-width="3"/>',
  psv:        '<path d="M35 40 L65 40 L50 60 Z M35 70 L65 70 L50 50 Z" fill="none" stroke="#1e3a5f" stroke-width="3"/><path d="M50 40 L50 25 L60 20" fill="none" stroke="#1e3a5f" stroke-width="3"/>',
  valve:      '<path d="M30 40 L70 60 M30 60 L70 40 M30 40 L30 60 M70 40 L70 60" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="50" y1="50" x2="50" y2="30" stroke="#1e3a5f" stroke-width="3"/>',
  meter:      '<rect x="15" y="42" width="70" height="16" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="50" y1="42" x2="50" y2="58" stroke="#1e3a5f" stroke-width="3"/><circle cx="50" cy="30" r="8" fill="none" stroke="#1e3a5f" stroke-width="3"/>',
  analyzer:   '<rect x="25" y="25" width="50" height="50" rx="6" fill="none" stroke="#1e3a5f" stroke-width="3"/><path d="M32 60 L42 45 L52 55 L62 38 L68 48" fill="none" stroke="#e87722" stroke-width="3"/>',
  panel:      '<rect x="25" y="20" width="50" height="60" fill="none" stroke="#1e3a5f" stroke-width="3"/><line x1="25" y1="40" x2="75" y2="40" stroke="#1e3a5f" stroke-width="2"/><line x1="25" y1="60" x2="75" y2="60" stroke="#1e3a5f" stroke-width="2"/>',
};
const placeholder = (kind) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ece6d8"/>${DRAW[kind] || DRAW.vessel}<text x="50" y="94" font-size="8" text-anchor="middle" fill="#6b7280" font-family="Consolas,monospace">SAMPLE · NO PHOTO</text></svg>`;

/* ---------- views ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

let render = async function () {
  $("#back").hidden = !current;
  $("#tabs").style.display = current ? "none" : "flex";
  $("#subtitle").textContent = `${reg.meta.facility} · ${reg.meta.label}`;
  if (current) return renderAsset(current);
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  if (tab === "areas") return renderAreas();
  if (tab === "search") return renderSearch("");
  if (tab === "report") return renderReport();
  if (tab === "export") return renderExport();
};
/* one bulk read for the whole register instead of one read per asset per slot */
const allEntries = () => new Promise((res) => {
  const st = tx("readonly"); const ks = st.getAllKeys(); const vs = st.getAll();
  vs.onsuccess = () => { const out = {}; ks.result.forEach((k, i) => (out[k] = vs.result[i])); res(out); };
});
async function statusMap() {
  const all = await allEntries(), m = {};
  for (const a of reg.assets) {
    const c = { slots: {}, data: all[`${a.id}:data`] || {} };
    for (const s of SLOTS()) c.slots[s.k] = all[`${a.id}:${s.k}`];
    m[a.id] = statusOf(c);
  }
  return m;
}

async function renderAreas() {
  const st = await statusMap();
  const total = reg.assets.length, col = Object.values(st).filter((s) => s === "collected").length, par = Object.values(st).filter((s) => s === "partial").length;
  let h = `<div class="kpis"><div class="kpi"><b>${total}</b><span>assets</span></div><div class="kpi"><b>${col}</b><span>collected</span></div><div class="kpi ${total - col - par ? "bad" : ""}"><b>${total - col - par}</b><span>gaps</span></div></div>`;
  h += `<div class="bar"><i style="width:${(100 * col) / total}%"></i></div>`;
  h += `<div class="meta" style="margin-top:8px">Schema: ${SLOTS().length} photo slots · ${FIELDS().length} data fields (${FIELDS().filter((f) => f.required).length} required)</div>`;
  h += `<h2>Areas</h2>`;
  for (const [code, name] of Object.entries(reg.areas)) {
    const list = reg.assets.filter((a) => a.area === code);
    const c = list.filter((a) => st[a.id] === "collected").length;
    h += `<div class="card row" data-area="${code}"><div class="grow"><div class="tag">${esc(code)}</div><div class="desc">${esc(name)}</div><div class="meta">${c} of ${list.length} collected</div><div class="bar"><i style="width:${list.length ? (100 * c) / list.length : 0}%"></i></div></div><span class="pill ${c === list.length ? "collected" : c ? "partial" : "gap"}">${c === list.length ? "DONE" : c ? "PARTIAL" : "OPEN"}</span></div>`;
  }
  $("#view").innerHTML = h;
  document.querySelectorAll("[data-area]").forEach((el) => el.onclick = () => renderList(el.dataset.area));
}
async function renderList(area) {
  const st = await statusMap();
  let h = `<h2>${esc(reg.areas[area])}</h2>`;
  for (const a of reg.assets.filter((x) => x.area === area)) h += assetRow(a, st[a.id]);
  $("#view").innerHTML = h; bindRows();
}
function assetRow(a, s) {
  return `<div class="card row" data-asset="${a.id}"><div class="grow"><div class="tag">${esc(a.tag)} <span class="meta">${esc(a.cls || "— no class")}</span></div><div class="desc">${esc(a.desc || "— no description")}</div><div class="meta">${esc(a.id)}${a.num ? " · #" + esc(a.num) : " · no asset number"}</div></div><span class="pill ${s}">${s.toUpperCase()}</span></div>`;
}
function bindRows() {
  document.querySelectorAll("[data-asset]").forEach((el) => el.onclick = () => { current = el.dataset.asset; render(); });
}
async function renderSearch(q) {
  const st = await statusMap();
  const needle = q.trim().toLowerCase();
  const hits = needle ? reg.assets.filter((a) => [a.tag, a.desc, a.id, a.cls, a.num].join(" ").toLowerCase().includes(needle)) : [];
  $("#view").innerHTML = `<input type="search" id="q" placeholder="Tag, description, id, class…" value="${esc(q)}" autofocus><h2>${needle ? hits.length + " match" + (hits.length === 1 ? "" : "es") : "Type the tag you are standing at"}</h2>` + hits.map((a) => assetRow(a, st[a.id])).join("");
  $("#q").oninput = (e) => renderSearch(e.target.value);
  bindRows();
}

function fieldInput(f, v) {
  const id = `f_${f.k}`;
  if (f.type === "select") return `<select id="${id}" data-field="${f.k}"><option value="">—</option>${f.options.map((o) => `<option ${v === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  if (f.type === "check") return `<label class="check"><input type="checkbox" id="${id}" data-field="${f.k}" ${v ? "checked" : ""}> ${esc(f.label)}</label>`;
  if (f.type === "number") return `<input type="number" inputmode="decimal" id="${id}" data-field="${f.k}" value="${esc(v ?? "")}" placeholder="${esc(f.hint || "")}">`;
  return `<input type="text" id="${id}" data-field="${f.k}" value="${esc(v ?? "")}" placeholder="${esc(f.hint || "")}">`;
}

async function renderAsset(id) {
  const a = reg.assets.find((x) => x.id === id);
  const c = await captures(id);
  const s = statusOf(c);
  let h = `<div class="card"><div class="row"><div class="grow"><div class="tag" style="font-size:20px">${esc(a.tag)}</div><div class="desc">${esc(a.desc || "— no description")}</div><div class="meta">${esc(reg.areas[a.area])} · ${esc(a.cls || "no class")} · ${esc(a.id)}${a.num ? " · #" + esc(a.num) : ""}</div></div><span class="pill ${s}">${s.toUpperCase()}</span></div></div>`;
  h += `<h2>Photos · ${SLOTS().length} slots</h2><div class="slots">`;
  for (const sl of SLOTS()) {
    const cap = c.slots[sl.k];
    const cls = cap?.blob ? "done" : cap?.skipped ? "skipped" : "";
    const thumb = cap?.blob ? `<img src="${URL.createObjectURL(cap.blob)}" alt="">` : placeholder(a.kind);
    h += `<div class="slot ${cls}"><div class="k">${sl.k} · ${esc(sl.label)}</div><div class="thumb">${thumb}</div><div class="hint">${esc(sl.hint || "")}</div>`;
    h += `<label class="primary">${cap?.blob ? "Retake" : "Capture"}<input type="file" accept="image/*" capture="environment" data-slot="${sl.k}"></label>`;
    if (sl.skippable && !cap?.blob) h += `<button class="ghost" data-skip="${sl.k}">${cap?.skipped ? "Skipped: " + esc(cap.note) : "Skip with note"}</button>`;
    if (cap?.blob) h += `<button class="ghost" data-clear="${sl.k}">Remove</button>`;
    h += `</div>`;
  }
  h += `</div>`;
  if (FIELDS().length) {
    h += `<h2>Data · ${FIELDS().length} fields</h2><div class="card fields">`;
    for (const f of FIELDS()) {
      h += `<div class="field">${f.type === "check" ? "" : `<label for="f_${f.k}">${esc(f.label)}${f.required ? ' <span class="req">required</span>' : ""}</label>`}${fieldInput(f, c.data[f.k])}</div>`;
    }
    h += `<div class="meta">Saved as you type. Stays on this device.</div></div>`;
  }
  $("#view").innerHTML = h;
  document.querySelectorAll("input[type=file]").forEach((inp) => inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    const blob = await shrink(f);
    await put(`${id}:${inp.dataset.slot}`, { blob, at: new Date().toISOString() });
    render();
  });
  document.querySelectorAll("[data-skip]").forEach((b) => b.onclick = async () => {
    const note = prompt("Why is this slot skipped? (required)"); if (!note) return;
    await put(`${id}:${b.dataset.skip}`, { skipped: true, note, at: new Date().toISOString() }); render();
  });
  document.querySelectorAll("[data-clear]").forEach((b) => b.onclick = async () => { await del(`${id}:${b.dataset.clear}`); render(); });
  document.querySelectorAll("[data-field]").forEach((el) => {
    const save = async () => {
      const data = (await get(`${id}:data`)) || {};
      data[el.dataset.field] = el.type === "checkbox" ? el.checked : el.value;
      data.__at = new Date().toISOString();
      await put(`${id}:data`, data);
      const pill = document.querySelector(".pill"); if (pill) { const st = statusOf(await captures(id)); pill.className = `pill ${st}`; pill.textContent = st.toUpperCase(); }
    };
    el.addEventListener("change", save); el.addEventListener("input", save);
  });
}

/* downscale on device so a walk of 200 assets is not 2 GB */
function shrink(file, max = 1600, q = 0.82) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => res(b || file), "image/jpeg", q);
    };
    img.onerror = () => res(file);
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- coverage: the register tells on itself ---------- */
function defects() {
  const byTag = {};
  reg.assets.forEach((a) => (byTag[a.tag] = byTag[a.tag] || []).push(a));
  return {
    noClass: reg.assets.filter((a) => !a.cls),
    noDesc: reg.assets.filter((a) => !a.desc),
    noNum: reg.assets.filter((a) => !a.num),
    dupTags: Object.entries(byTag).filter(([, l]) => l.length > 1),
  };
}
async function renderReport() {
  const d = defects(), st = await statusMap();
  const n = reg.assets.length;
  const pct = (x) => `${Math.round((100 * x) / n)}%`;
  let h = `<div class="kpis"><div class="kpi ${d.noClass.length ? "bad" : ""}"><b>${d.noClass.length}</b><span>no class · ${pct(d.noClass.length)}</span></div><div class="kpi ${d.noDesc.length ? "bad" : ""}"><b>${d.noDesc.length}</b><span>no description</span></div><div class="kpi ${d.noNum.length ? "bad" : ""}"><b>${d.noNum.length}</b><span>no asset number</span></div></div>`;
  h += `<p class="note" style="margin-top:10px">This report reads the register, not the photos. These are the rows that fail at load time, long after someone approved them.</p>`;
  const block = (title, list, f) => list.length ? `<h2>${title}</h2>` + list.map(f).join("") : "";
  const defectRow = (a) => assetRow(a, st[a.id]).replace('class="card row"', 'class="card row defect"');
  h += block("Duplicate process tags", d.dupTags, ([t, l]) => `<div class="card defect"><div class="tag">${esc(t)}</div>${l.map((a) => `<div class="meta">${esc(a.id)} · ${esc(reg.areas[a.area])} · ${esc(a.desc || "no description")}</div>`).join("")}</div>`);
  h += block("Missing class", d.noClass, defectRow);
  h += block("Missing description", d.noDesc, defectRow);
  h += block("No asset number", d.noNum, defectRow);
  $("#view").innerHTML = h; bindRows();
}

/* ---------- export: one zip — photos, manifest with every field, coverage, the config ---------- */
async function renderExport() {
  const keys = (await allKeys()).filter((k) => !String(k).startsWith("__"));
  $("#view").innerHTML = `<div class="card"><div class="sample">Export</div><p>${keys.length} record${keys.length === 1 ? "" : "s"} on this device. The zip holds every photo named <span class="tag">assetid_slot.jpg</span>, a manifest CSV with status and every data field per asset, the coverage CSV, and the configuration that produced them.</p><p class="muted" style="margin-top:8px">Nothing leaves the phone until you share the file.</p><p style="margin-top:12px"><button class="primary" id="zip">Build the zip</button></p></div>
  <div class="card"><div class="sample">Bespoke deployment</div><p class="muted">Replace the sample with your own schema and register: Menu → Import a configuration. Same shape as seed.js, as JSON. The app does not change.</p></div>`;
  $("#zip").onclick = async () => {
    const zip = new JSZip();
    const F = FIELDS();
    const rows = [["asset_id", "area", "tag", "description", "class", "asset_number", "status", "slots_done", "slots_skipped", "slot_notes", ...F.map((f) => f.k)]];
    for (const a of reg.assets) {
      const c = await captures(a.id); let done = 0, skipped = 0, notes = [];
      for (const s of SLOTS()) {
        const cap = c.slots[s.k]; if (!cap) continue;
        if (cap.blob) { done++; zip.file(`photos/${a.id}_${s.k}.jpg`, cap.blob); }
        else if (cap.skipped) { skipped++; notes.push(`slot ${s.k}: ${cap.note}`); }
      }
      rows.push([a.id, a.area, a.tag, a.desc, a.cls, a.num, statusOf(c), done, skipped, notes.join(" | "), ...F.map((f) => c.data[f.k] === true ? "yes" : c.data[f.k] === false ? "no" : c.data[f.k] ?? "")]);
    }
    const d = defects();
    const cov = [["issue", "asset_id", "tag", "detail"]];
    d.noClass.forEach((a) => cov.push(["missing class", a.id, a.tag, a.desc]));
    d.noDesc.forEach((a) => cov.push(["missing description", a.id, a.tag, a.cls]));
    d.noNum.forEach((a) => cov.push(["no asset number", a.id, a.tag, a.desc]));
    d.dupTags.forEach(([t, l]) => l.forEach((a) => cov.push(["duplicate tag", a.id, t, reg.areas[a.area]])));
    zip.file("manifest.csv", csv(rows)); zip.file("coverage.csv", csv(cov)); zip.file("config.json", JSON.stringify(reg, null, 1));
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `fic_${reg.meta.facility.replace(/\W+/g, "-").toLowerCase()}_${new Date().toISOString().slice(0, 10)}.zip`; a.click();
  };
}
const csv = (rows) => rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");

/* ---------- menu ---------- */
$("#menu").onclick = () => $("#menuDlg").showModal();
$("#closeMenu").onclick = () => $("#menuDlg").close();
$("#resetBtn").onclick = async () => { if (confirm("Erase every record on this device and reload the sample configuration?")) { await clearAll(); await loadRegister(); current = null; $("#menuDlg").close(); render(); } };
$("#importBtn").onclick = () => {
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
  inp.onchange = async () => { const t = await inp.files[0].text(); const r = JSON.parse(t); if (!r.assets || !r.areas) return alert("Expected { meta, schema, areas, assets }"); await clearAll(); await put("__register", r); reg = r; current = null; $("#menuDlg").close(); render(); };
  inp.click();
};
$("#back").onclick = () => { current = null; render(); };
document.querySelectorAll("#tabs button").forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });

/* deep link: #A-010 opens that asset; the hash follows navigation so a page can be shared or bookmarked */
window.addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && reg?.assets.some((a) => a.id === id)) { current = id; render(); } });
const _render = render;
render = async function () { const want = current ? `#${current}` : ""; if (location.hash !== want) history.replaceState(null, "", location.pathname + want); return _render(); };

(async () => { db = await openDb(); await loadRegister(); const id = location.hash.slice(1); if (id && reg.assets.some((a) => a.id === id)) current = id; render(); })();
