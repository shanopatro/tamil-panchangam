/* ==========================================================================
   கடல்நிலா பஞ்சாங்கம் — UI logic
   Depends on js/panchangam.js being loaded first.
   ========================================================================== */

const state = {
  lat: DEFAULT_LOCATION.lat,
  lon: DEFAULT_LOCATION.lon,
  locationName: DEFAULT_LOCATION.name,
  view: "daily",
  dailyDate: new Date(), // JS local date, we only read y/m/d from it
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth() + 1,
  yearYear: new Date().getFullYear()
};

function todayIST() {
  // Approximate "today" in IST regardless of viewer's own timezone
  const now = new Date();
  const shifted = new Date(now.getTime() + IST_OFFSET_MIN * 60000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() };
}

/* ---------- moon phase icon (simple SVG crescent, purely decorative) ---------- */
function moonPhaseSVG(elongDeg, size = 78) {
  // elongDeg 0=new,180=full. illumination fraction:
  const illum = (1 - Math.cos(deg2rad(elongDeg))) / 2;
  const r = size / 2 - 4;
  const cx = size / 2, cy = size / 2;
  // shift of terminator ellipse based on illumination (approx)
  const k = 1 - 2 * illum;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1C2652" stroke="#9FB4D9" stroke-width="1.2"/>
    <clipPath id="moonclip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#moonclip)">
      <rect x="${cx}" y="${cy-r}" width="${r*2}" height="${r*2}" fill="#F0C868"
        transform="translate(${-r},0) scale(${elongDeg<=180?1:-1},1)" />
      <ellipse cx="${cx}" cy="${cy}" rx="${Math.abs(k)*r}" ry="${r}" fill="${k>0? '#1C2652':'#F0C868'}"/>
    </g>
  </svg>`;
}

/* ---------- DAILY VIEW ---------- */
function renderDaily() {
  const { y, m, d } = { y: state.dailyDate.getFullYear(), m: state.dailyDate.getMonth()+1, d: state.dailyDate.getDate() };
  const lat = state.lat, lon = state.lon;
  const dp = dayPeriods(y, m, d, lat, lon);
  const p = dp.sunrise ? panchangamAt(dp.sunrise) : panchangamAt(new Date(Date.UTC(y,m-1,d,3,0)));
  const occasions = specialOccasionsForDay(y, m, d, lat, lon);
  const tamilMonthApprox = TAMIL_MONTHS[(m + 2) % 12]; // rough mapping, actual Tamil month needs solar ingress calc

  const el = document.getElementById("view-daily");
  el.innerHTML = `
    <div class="panel hero-day">
      <div>
        <div class="hero-date">${String(d).padStart(2,"0")}-${String(m).padStart(2,"0")}-${y} · ${WEEKDAY_NAMES[dp.weekday]}</div>
        <div class="hero-tithi">${p.tithi.paksha} ${p.tithi.name}</div>
        <div style="color:var(--silver); font-size:14px; margin-top:4px;">${p.nakshatra.name} நட்சத்திரம் · பாதம் ${p.nakshatra.pada}</div>
      </div>
      ${moonPhaseSVG(p.elongation)}
    </div>

    ${occasions.length ? `<div class="panel">
      <h2>✦ சிறப்பு நாள்</h2>
      ${occasions.map(o => `<div class="occasion-badge">${o.type}</div>`).join("")}
      ${occasions.map(o => `<div class="period-row good"><span class="name">${o.type}</span><span class="time">${fmtDateTime(o.start)} → ${fmtDateTime(o.end)}</span></div>`).join("")}
    </div>` : ""}

    <div class="panel">
      <h2>விரிவான பஞ்சாங்கம்</h2>
      <div class="grid-cards">
        <div class="info-card"><div class="label">திதி</div><div class="value">${p.tithi.paksha}<br>${p.tithi.name}</div></div>
        <div class="info-card"><div class="label">நட்சத்திரம்</div><div class="value">${p.nakshatra.name} - பாதம் ${p.nakshatra.pada}</div></div>
        <div class="info-card"><div class="label">யோகம்</div><div class="value">${p.yoga.name}</div></div>
        <div class="info-card"><div class="label">கரணம்</div><div class="value">${p.karana.name}</div></div>
        <div class="info-card"><div class="label">வாரம்</div><div class="value">${WEEKDAY_NAMES[dp.weekday]}</div></div>
        <div class="info-card"><div class="label">தமிழ் மாதம் (தோராயம்)</div><div class="value">${tamilMonthApprox}</div></div>
        <div class="info-card"><div class="label">சூர்ய உதயம்</div><div class="value mono">${fmtTime(dp.sunrise)}</div></div>
        <div class="info-card"><div class="label">சூர்ய அஸ்தமனம்</div><div class="value mono">${fmtTime(dp.sunset)}</div></div>
      </div>
    </div>

    <div class="panel">
      <h2>காலங்கள்</h2>
      <div class="period-row"><span class="name">ராகு காலம்</span><span class="time">${fmtTime(dp.rahu?.start)} - ${fmtTime(dp.rahu?.end)}</span></div>
      <div class="period-row"><span class="name">எமகண்டம்</span><span class="time">${fmtTime(dp.yama?.start)} - ${fmtTime(dp.yama?.end)}</span></div>
      <div class="period-row"><span class="name">குளிகை காலம்</span><span class="time">${fmtTime(dp.kuligai?.start)} - ${fmtTime(dp.kuligai?.end)}</span></div>
      ${dp.nallaNeram.map(n => `<div class="period-row good"><span class="name">நல்ல நேரம்</span><span class="time">${fmtTime(n.start)} - ${fmtTime(n.end)}</span></div>`).join("")}
    </div>

    <div class="disclaimer">* இந்தக் கணிப்புகள் வானியல் தோராய சூத்திரங்களைப் (Lahiri Ayanamsa) பயன்படுத்தி கணக்கிடப்படுகின்றன. அச்சு பஞ்சாங்கங்களுடன் சிறு நிமிட வித்தியாசம் இருக்கலாம். "நல்ல நேரம்" என்பது ராகு/எம/குளிகை காலம் தவிர்த்த எளிய கணிப்பு.</div>
  `;
}

function shiftDailyDate(deltaDays) {
  const nd = new Date(state.dailyDate);
  nd.setDate(nd.getDate() + deltaDays);
  state.dailyDate = nd;
  renderDaily();
}

/* ---------- MONTHLY VIEW ---------- */
function renderMonthly() {
  const { calYear: y, calMonth: m } = state;
  const lat = state.lat, lon = state.lon;
  const nDays = daysInMonth(y, m);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const today = todayIST();

  let cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(`<div class="cal-cell empty"></div>`);

  for (let d = 1; d <= nDays; d++) {
    const dp = dayPeriods(y, m, d, lat, lon);
    const p = dp.sunrise ? panchangamAt(dp.sunrise) : null;
    const occasions = specialOccasionsForDay(y, m, d, lat, lon);
    const isToday = today.y === y && today.m === m && today.d === d;
    cells.push(`
      <div class="cal-cell ${isToday ? "today" : ""}" onclick="openDayModal(${y},${m},${d})">
        <div class="d-num">${d}</div>
        <div class="d-tithi">${p ? p.tithi.name : ""}</div>
        <div class="d-badges">${occasions.map(()=>'<span class="dot"></span>').join("")}</div>
      </div>
    `);
  }

  const el = document.getElementById("view-monthly");
  el.innerHTML = `
    <div class="panel">
      <div class="cal-nav">
        <button onclick="shiftMonth(-1)">‹</button>
        <div class="cal-title">${TAMIL_MONTHS_ENGLISH_LABEL(m)} ${y}</div>
        <button onclick="shiftMonth(1)">›</button>
      </div>
      <div class="cal-grid">
        ${["ஞா","தி","செ","பு","வி","வெ","ச"].map(w=>`<div class="cal-weekday">${w}</div>`).join("")}
        ${cells.join("")}
      </div>
    </div>
    <div class="disclaimer">* தேதி மேல் க்ளிக் செய்து விரிவான பஞ்சாங்கத்தைக் காணலாம். ஒவ்வொரு புள்ளியும் (●) அன்று ஒரு சிறப்பு நாள் (பௌர்ணமி/அமாவாசை/ஏகாதசி/பிரதோஷம்/கார்த்திகை/சஷ்டி) குறிக்கிறது.</div>
  `;
}
function TAMIL_MONTHS_ENGLISH_LABEL(m) {
  const names = ["ஜனவரி","பிப்ரவரி","மார்ச்","ஏப்ரல்","மே","ஜூன்","ஜூலை","ஆகஸ்ட்","செப்டம்பர்","அக்டோபர்","நவம்பர்","டிசம்பர்"];
  return names[m - 1];
}
function shiftMonth(delta) {
  let m = state.calMonth + delta, y = state.calYear;
  if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
  state.calMonth = m; state.calYear = y;
  renderMonthly();
}
function openDayModal(y, m, d) {
  const lat = state.lat, lon = state.lon;
  const dp = dayPeriods(y, m, d, lat, lon);
  const p = dp.sunrise ? panchangamAt(dp.sunrise) : null;
  const occasions = specialOccasionsForDay(y, m, d, lat, lon);
  const box = document.getElementById("modal-content");
  box.innerHTML = `
    <button class="close-btn" onclick="closeDayModal()">✕</button>
    <h2 style="margin-top:0;">${String(d).padStart(2,"0")}-${String(m).padStart(2,"0")}-${y}</h2>
    ${p ? `<p style="color:var(--gold-soft); font-family:var(--font-display); font-weight:700; font-size:18px;">${p.tithi.paksha} ${p.tithi.name}</p>
    <div class="grid-cards" style="margin-bottom:14px;">
      <div class="info-card"><div class="label">நட்சத்திரம்</div><div class="value">${p.nakshatra.name} - பாதம் ${p.nakshatra.pada}</div></div>
      <div class="info-card"><div class="label">யோகம்</div><div class="value">${p.yoga.name}</div></div>
      <div class="info-card"><div class="label">கரணம்</div><div class="value">${p.karana.name}</div></div>
      <div class="info-card"><div class="label">சூர்ய உதயம்/அஸ்தமனம்</div><div class="value mono">${fmtTime(dp.sunrise)} / ${fmtTime(dp.sunset)}</div></div>
    </div>
    <div class="period-row"><span class="name">ராகு காலம்</span><span class="time">${fmtTime(dp.rahu?.start)} - ${fmtTime(dp.rahu?.end)}</span></div>
    <div class="period-row"><span class="name">எமகண்டம்</span><span class="time">${fmtTime(dp.yama?.start)} - ${fmtTime(dp.yama?.end)}</span></div>
    <div class="period-row"><span class="name">குளிகை காலம்</span><span class="time">${fmtTime(dp.kuligai?.start)} - ${fmtTime(dp.kuligai?.end)}</span></div>
    ` : ""}
    ${occasions.length ? `<div style="margin-top:12px;">${occasions.map(o=>`<div class="period-row good"><span class="name">${o.type}</span><span class="time">${fmtDateTime(o.start)} → ${fmtDateTime(o.end)}</span></div>`).join("")}</div>` : ""}
  `;
  document.getElementById("modal-backdrop").classList.add("open");
}
function closeDayModal() { document.getElementById("modal-backdrop").classList.remove("open"); }

/* ---------- YEARLY VIEW ---------- */
function renderYearly() {
  const y = state.yearYear;
  const lat = state.lat, lon = state.lon;
  const groups = {};
  const order = ["பௌர்ணமி","அமாவாசை","ஏகாதசி (சுக்ல)","ஏகாதசி (கிருஷ்ண)","பிரதோஷம் (சுக்ல)","பிரதோஷம் (கிருஷ்ண)","சஷ்டி (சுக்ல)","சஷ்டி (கிருஷ்ண)","கார்த்திகை"];
  order.forEach(k => groups[k] = []);

  const nDaysYear = (new Date(y,1,29).getMonth() === 1) ? 366 : 365;
  let seen = new Set(); // avoid duplicate consecutive-day detections for same occurrence
  for (let doy = 0; doy < nDaysYear; doy++) {
    const dt = new Date(Date.UTC(y, 0, 1 + doy));
    const yy = dt.getUTCFullYear(), mm = dt.getUTCMonth() + 1, dd = dt.getUTCDate();
    const occ = specialOccasionsForDay(yy, mm, dd, lat, lon);
    occ.forEach(o => {
      const key = o.type + "_" + (o.start ? Math.round(o.start.getTime()/3600000) : doy);
      if (seen.has(key)) return;
      seen.add(key);
      if (groups[o.type]) groups[o.type].push(o);
    });
  }

  const el = document.getElementById("view-yearly");
  el.innerHTML = `
    <div class="panel">
      <div class="year-controls">
        <button class="tab-btn" onclick="shiftYear(-1)">‹ ${state.yearYear - 1}</button>
        <div class="cal-title">${y} ஆண்டு நிகழ்வுகள்</div>
        <button class="tab-btn" onclick="shiftYear(1)">${state.yearYear + 1} ›</button>
      </div>
      <div class="year-groups">
        ${order.filter(k=>groups[k].length).map(k => `
          <div class="year-group">
            <h3>${k} (${groups[k].length})</h3>
            ${groups[k].map(o => `<div class="year-item"><span class="yi-date">${fmtDateTime(o.start)}</span><span class="yi-time">→ ${fmtDateTime(o.end)}</span></div>`).join("")}
          </div>
        `).join("")}
      </div>
    </div>
    <div class="disclaimer">* கணக்கீடு சற்று நேரம் எடுக்கலாம். இந்த தேதிகள் தோராயமானவை (Lahiri Ayanamsa அடிப்படையில்).</div>
  `;
}
function shiftYear(delta) { state.yearYear += delta; renderYearly(); }

/* ---------- view switching ---------- */
function switchView(view) {
  state.view = view;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view-panel").forEach(v => v.style.display = "none");
  document.getElementById("view-" + view).style.display = "block";
  if (view === "daily") renderDaily();
  if (view === "monthly") renderMonthly();
  if (view === "yearly") { document.getElementById("view-yearly").innerHTML = '<div class="panel">கணக்கிடுகிறது...</div>'; setTimeout(renderYearly, 30); }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loc-name").textContent = state.locationName;
  switchView("daily");
});