/* =========================================================
   கடல்நிலா பஞ்சாங்கம் - Astronomical Calculation Engine
   Sun/Moon longitude: Meeus low-precision formulas
   Ayanamsa: Lahiri approximation
   ========================================================= */

const DEG = Math.PI / 180;
const norm360 = d => ((d % 360) + 360) % 360;

/* ---------- Julian Day ---------- */
function toJulianDay(dateObj){
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth() + 1;
  const d = dateObj.getUTCDate() +
    (dateObj.getUTCHours() + dateObj.getUTCMinutes()/60 + dateObj.getUTCSeconds()/3600)/24;
  let Y = y, M = m;
  if (M <= 2){ Y -= 1; M += 12; }
  const A = Math.floor(Y/100);
  const B = 2 - A + Math.floor(A/4);
  return Math.floor(365.25*(Y+4716)) + Math.floor(30.6001*(M+1)) + d + B - 1524.5;
}

/* ---------- Sun ecliptic longitude (tropical, degrees) ---------- */
function sunLongitude(jd){
  const T = (jd - 2451545.0) / 36525;
  const L0 = norm360(280.46646 + 36000.76983*T + 0.0003032*T*T);
  const M  = norm360(357.52911 + 35999.05029*T - 0.0001537*T*T);
  const Mr = M*DEG;
  const C = (1.914602 - 0.004817*T - 0.000014*T*T)*Math.sin(Mr)
          + (0.019993 - 0.000101*T)*Math.sin(2*Mr)
          + 0.000289*Math.sin(3*Mr);
  return norm360(L0 + C);
}

/* ---------- Moon ecliptic longitude (tropical, degrees) ---------- */
function moonLongitude(jd){
  const T = (jd - 2451545.0) / 36525;
  const Lp = norm360(218.3164477 + 481267.88123421*T);
  const D  = norm360(297.8501921 + 445267.1114034*T);
  const M  = norm360(357.5291092 + 35999.0502909*T);
  const Mp = norm360(134.9633964 + 477198.8675055*T);
  const F  = norm360(93.2720950  + 483202.0175233*T);
  const Dr=D*DEG, Mr=M*DEG, Mpr=Mp*DEG, Fr=F*DEG;
  const dL =
      6.288774*Math.sin(Mpr)
    + 1.274027*Math.sin(2*Dr-Mpr)
    + 0.658314*Math.sin(2*Dr)
    + 0.213618*Math.sin(2*Mpr)
    - 0.185116*Math.sin(Mr)
    - 0.114332*Math.sin(2*Fr)
    + 0.058793*Math.sin(2*Dr-2*Mpr)
    + 0.057066*Math.sin(2*Dr-Mr-Mpr)
    + 0.053322*Math.sin(2*Dr+Mpr)
    + 0.045758*Math.sin(2*Dr-Mr)
    - 0.040923*Math.sin(Mr-Mpr)
    - 0.034720*Math.sin(Dr)
    - 0.030383*Math.sin(Mr+Mpr);
  return norm360(Lp + dL);
}

/* ---------- Lahiri Ayanamsa (approximation) ---------- */
function lahiriAyanamsa(jd){
  const yearsSince2000 = (jd - 2451545.0) / 365.25;
  return 23.85 + 0.013972 * yearsSince2000; // degrees
}

/* ---------- Mean longitudes for other grahas ---------- */
function meanLongitude(jd, l0, rate){
  const d = jd - 2451545.0;
  return norm360(l0 + rate*d);
}
function mercuryLongitude(jd){ return meanLongitude(jd, 252.250906, 4.09233445); }
function venusLongitude(jd){ return meanLongitude(jd, 181.979801, 1.60213034); }
function marsLongitude(jd){ return meanLongitude(jd, 355.433, 0.52407629); }
function jupiterLongitude(jd){ return meanLongitude(jd, 34.351519, 0.08308529); }
function saturnLongitude(jd){ return meanLongitude(jd, 50.077444, 0.03344414); }
function rahuLongitude(jd){ return meanLongitude(jd, 125.1228, -0.0529538083); }

/* ---------- Names ---------- */
const RASI = ["மேஷம்","ரிஷபம்","மிதுனம்","கடகம்","சிம்மம்","கன்னி","துலாம்","விருச்சிகம்","தனுசு","மகரம்","கும்பம்","மீனம்"];
const NAKSHATRA = ["அஸ்வினி","பரணி","கார்த்திகை","ரோகிணி","மிருகசீரிடம்","திருவாதிரை","புனர்பூசம்","பூசம்","ஆயில்யம்",
  "மகம்","பூரம்","உத்திரம்","ஹஸ்தம்","சித்திரை","சுவாதி","விசாகம்","அனுஷம்","கேட்டை",
  "மூலம்","பூராடம்","உத்திராடம்","திருவோணம்","அவிட்டம்","சதயம்","பூரட்டாதி","உத்திரட்டாதி","ரேவதி"];
const TITHI_NAMES = ["பிரதமை","துவிதியை","திருதியை","சதுர்த்தி","பஞ்சமி","சஷ்டி","சப்தமி","அஷ்டமி","நவமி","தசமி",
  "ஏகாதசி","துவாதசி","திரயோதசி","சதுர்த்தசி","பௌர்ணமி/அமாவாசை"];
const YOGA_NAMES = ["விஷ்கம்பம்","பிரீதி","ஆயுஷ்மான்","சௌபாக்கியம்","சோபனம்","அதிகண்டம்","சுகர்மா","திருதி","சூலம்","கண்டம்",
  "விருத்தி","துருவம்","வியாகாதம்","ஹர்ஷணம்","வஜ்ரம்","சித்தி","வியதீபாதம்","வரீயான்","பரிகம்","சிவம்",
  "சித்தம்","சாத்யம்","சுபம்","சுக்லம்","பிரம்மம்","ஐந்திரம்","வைதிருதி"];
const KARANA_NAMES = ["பவ","பாலவ","கௌலவ","தைதுல","கரஜ","வணிஜ","விஷ்டி","சகுனி","சதுஷ்பாதம்","நாகவம்","கிம்ஸ்துக்னம்"];
const VAARA = ["ஞாயிறு","திங்கள்","செவ்வாய்","புதன்","வியாழன்","வெள்ளி","சனி"];
const TAMIL_MONTHS = ["சித்திரை","வைகாசி","ஆனி","ஆடி","ஆவணி","புரட்டாசி","ஐப்பசி","கார்த்திகை","மார்கழி","தை","மாசி","பங்குனி"];

const RAHU_PART = [8,2,7,5,6,4,3];
const YAMA_PART  = [5,4,3,2,1,7,6];
const GULIKA_PART= [7,6,5,4,3,2,1];

/* ---------- Sunrise/Sunset ---------- */
function sunriseSunset(dateObj, lat, lon){
  const jd = toJulianDay(new Date(Date.UTC(dateObj.getUTCFullYear(),dateObj.getUTCMonth(),dateObj.getUTCDate(),0,0,0)));
  const n = jd - 2451545.0 + 0.0008;
  const meanAnomaly = norm360(357.5291 + 0.98560028*n);
  const center = 1.9148*Math.sin(meanAnomaly*DEG) + 0.0200*Math.sin(2*meanAnomaly*DEG) + 0.0003*Math.sin(3*meanAnomaly*DEG);
  const eclipticLon = norm360(meanAnomaly + 102.9372 + center + 180);
  const sinDec = Math.sin(eclipticLon*DEG)*Math.sin(23.4397*DEG);
  const dec = Math.asin(sinDec);
  const latR = lat*DEG;
  const cosH = (Math.sin(-0.83*DEG) - Math.sin(latR)*Math.sin(dec)) / (Math.cos(latR)*Math.cos(dec));
  const clamped = Math.max(-1, Math.min(1, cosH));
  const H = Math.acos(clamped) / DEG;
  const solarNoonUTC = 12 - lon/15;
  const sunriseUTC = solarNoonUTC - H/15;
  const sunsetUTC  = solarNoonUTC + H/15;
  return { sunrise: sunriseUTC, sunset: sunsetUTC };
}

function fmtHM(hoursUTCFloat, tzOffsetHours){
  let h = hoursUTCFloat + tzOffsetHours;
  h = ((h % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.round((h-hh)*60);
  const period = hh < 12 ? "AM" : "PM";
  let h12 = hh % 12; if (h12===0) h12=12;
  return `${h12}:${mm.toString().padStart(2,'0')} ${period}`;
}

function decimalToClockLabel(hoursUTCFloat, tzOffsetHours){
  let h = hoursUTCFloat + tzOffsetHours;
  h = ((h % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.round((h-hh)*60);
  return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`;
}

const IST_OFFSET = 5.5;

/* ---------- Core Panchangam computation ---------- */
function computePanchangam(dateObj, lat, lon){
  const noonUTC = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 12 - IST_OFFSET, 0, 0));
  const jd = toJulianDay(noonUTC);
  const ayan = lahiriAyanamsa(jd);

  const sunTrop = sunLongitude(jd);
  const moonTrop = moonLongitude(jd);
  const sunSid = norm360(sunTrop - ayan);
  const moonSid = norm360(moonTrop - ayan);

  let diff = norm360(moonTrop - sunTrop);
  const tithiIndex = Math.floor(diff/12);
  const paksha = tithiIndex < 15 ? "சுக்ல பட்சம்" : "கிருஷ்ண பட்சம்";
  let tithiNameIdx = tithiIndex % 15;
  let tithiName = (tithiNameIdx===14) ? (tithiIndex<15?"பௌர்ணமி":"அமாவாசை") : TITHI_NAMES[tithiNameIdx];

  const nakshatraSpan = 360/27;
  const nakIndex = Math.floor(moonSid / nakshatraSpan);
  const nakPada = Math.floor((moonSid % nakshatraSpan) / (nakshatraSpan/4)) + 1;

  const yogaVal = norm360(sunSid + moonSid);
  const yogaIndex = Math.floor(yogaVal / nakshatraSpan);

  const karanaNum = Math.floor(diff/6);
  let karanaIdx;
  if (karanaNum === 0) karanaIdx = 10;
  else if (karanaNum >= 57) karanaIdx = 7 + (karanaNum-57);
  else karanaIdx = (karanaNum-1) % 7;

  const vaaraIdx = dateObj.getUTCDay();

  const {sunrise, sunset} = sunriseSunset(dateObj, lat, lon);
  const dayLength = sunset - sunrise;
  const partLen = dayLength/8;

  const rahuStart = sunrise + (RAHU_PART[vaaraIdx]-1)*partLen;
  const yamaStart = sunrise + (YAMA_PART[vaaraIdx]-1)*partLen;
  const gulikaStart = sunrise + (GULIKA_PART[vaaraIdx]-1)*partLen;

  return {
    tithi: `${tithiName} (${paksha})`,
    nakshatra: NAKSHATRA[nakIndex] + ` - பாதம் ${nakPada}`,
    nakshatraRaw: NAKSHATRA[nakIndex],
    yoga: YOGA_NAMES[yogaIndex],
    karana: KARANA_NAMES[karanaIdx] || "-",
    vaara: VAARA[vaaraIdx],
    sunrise: fmtHM(sunrise, IST_OFFSET),
    sunset: fmtHM(sunset, IST_OFFSET),
    rahuKalam: `${decimalToClockLabel(rahuStart, IST_OFFSET)} - ${decimalToClockLabel(rahuStart+partLen, IST_OFFSET)}`,
    yamagandam: `${decimalToClockLabel(yamaStart, IST_OFFSET)} - ${decimalToClockLabel(yamaStart+partLen, IST_OFFSET)}`,
    gulikaKalam: `${decimalToClockLabel(gulikaStart, IST_OFFSET)} - ${decimalToClockLabel(gulikaStart+partLen, IST_OFFSET)}`,
  };
}

function tamilMonthApprox(dateObj){
  const jd = toJulianDay(dateObj);
  const ayan = lahiriAyanamsa(jd);
  const sunSid = norm360(sunLongitude(jd) - ayan);
  const rasiIdx = Math.floor(sunSid/30);
  return TAMIL_MONTHS[rasiIdx];
}

/* =========================================================
   UI WIRING
   ========================================================= */
function getSelectedCity(selectEl){
  const opt = selectEl.options[selectEl.selectedIndex];
  return { lat: parseFloat(opt.dataset.lat), lon: parseFloat(opt.dataset.lon) };
}

function renderToday(){
  const citySel = document.getElementById('cityInput');
  const dateInput = document.getElementById('dateInput');
  const {lat, lon} = getSelectedCity(citySel);
  const dateVal = dateInput.value ? new Date(dateInput.value+"T00:00:00Z") : new Date();
  const p = computePanchangam(dateVal, lat, lon);
  const tamilMonth = tamilMonthApprox(dateVal);

  document.getElementById('todayTamilDate').textContent = `${tamilMonth} மாதம் - ${p.tithi}`;
  document.getElementById('todayGregorian').textContent = dateVal.toDateString();

  document.getElementById('chipTithi').textContent = p.tithi;
  document.getElementById('chipNakshatra').textContent = p.nakshatraRaw;
  document.getElementById('chipRahu').textContent = p.rahuKalam;

  document.getElementById('olaVaara').textContent = p.vaara + "க்கிழமை";
  document.getElementById('olaTithi').textContent = p.tithi;
  document.getElementById('olaNakshatra').textContent = p.nakshatra;
  document.getElementById('olaYoga').textContent = p.yoga;
  document.getElementById('olaKarana').textContent = p.karana;
  document.getElementById('olaSunrise').textContent = p.sunrise;
  document.getElementById('olaSunset').textContent = p.sunset;

  const panchGrid = document.getElementById('panchGrid');
  panchGrid.innerHTML = `
    <div class="pcard"><div class="pk">திதி</div><div class="pv">${p.tithi}</div></div>
    <div class="pcard"><div class="pk">நட்சத்திரம்</div><div class="pv">${p.nakshatra}</div></div>
    <div class="pcard"><div class="pk">யோகம்</div><div class="pv">${p.yoga}</div></div>
    <div class="pcard"><div class="pk">கரணம்</div><div class="pv">${p.karana}</div></div>
    <div class="pcard"><div class="pk">வாரம்</div><div class="pv">${p.vaara}க்கிழமை</div></div>
    <div class="pcard"><div class="pk">தமிழ் மாதம்</div><div class="pv">${tamilMonth}</div></div>
    <div class="pcard"><div class="pk">சூரிய உதயம்</div><div class="pv">${p.sunrise}</div></div>
    <div class="pcard"><div class="pk">சூரிய அஸ்தமனம்</div><div class="pv">${p.sunset}</div></div>
  `;

  const kalamGrid = document.getElementById('kalamGrid');
  kalamGrid.innerHTML = `
    <div class="kcard"><div class="pk">ராகு காலம்</div><div class="pv">${p.rahuKalam}</div></div>
    <div class="kcard"><div class="pk">யமகண்டம்</div><div class="pv">${p.yamagandam}</div></div>
    <div class="kcard"><div class="pk">குளிகை காலம்</div><div class="pv">${p.gulikaKalam}</div></div>
  `;
}

/* Jathagam Calculator */
function handleJathagamSubmit(e){
  e.preventDefault();
  const dob = document.getElementById('jDob').value;
  const time = document.getElementById('jTime').value;
  const citySel = document.getElementById('jCity');
  const {lat, lon} = getSelectedCity(citySel);
  if (!dob || !time) return;

  const [hh, mm] = time.split(':').map(Number);
  const localDate = new Date(dob+"T00:00:00");
  const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), hh - IST_OFFSET, mm));
  const jd = toJulianDay(utcDate);
  const ayan = lahiriAyanamsa(jd);

  const sunSid = norm360(sunLongitude(jd) - ayan);
  const moonSid = norm360(moonLongitude(jd) - ayan);
  const mercurySid = norm360(mercuryLongitude(jd) - ayan);
  const venusSid = norm360(venusLongitude(jd) - ayan);
  const marsSid = norm360(marsLongitude(jd) - ayan);
  const jupiterSid = norm360(jupiterLongitude(jd) - ayan);
  const saturnSid = norm360(saturnLongitude(jd) - ayan);
  const rahuSid = norm360(rahuLongitude(jd) - ayan);
  const ketuSid = norm360(rahuSid + 180);

  const suryaRasi = RASI[Math.floor(sunSid/30)];
  const chandraRasi = RASI[Math.floor(moonSid/30)];
  const nakIdx = Math.floor(moonSid/(360/27));
  const nakPada = Math.floor((moonSid % (360/27))/((360/27)/4))+1;

  document.getElementById('jrSummary').innerHTML = `
    <div class="jcard"><div class="jk">சூரிய ராசி</div><div class="jv">${suryaRasi}</div></div>
    <div class="jcard"><div class="jk">சந்திர ராசி</div><div class="jv">${chandraRasi}</div></div>
    <div class="jcard"><div class="jk">ஜென்ம நட்சத்திரம்</div><div class="jv">${NAKSHATRA[nakIdx]}</div></div>
    <div class="jcard"><div class="jk">பாதம்</div><div class="jv">${nakPada}</div></div>
  `;

  const grahas = [
    ["சூரியன்", sunSid], ["சந்திரன்", moonSid], ["புதன்", mercurySid],
    ["சுக்கிரன்", venusSid], ["செவ்வாய்", marsSid], ["குரு", jupiterSid],
    ["சனி", saturnSid], ["ராகு", rahuSid], ["கேது", ketuSid]
  ];
  const tbody = document.getElementById('grahaTableBody');
  tbody.innerHTML = grahas.map(([name,lonVal])=>{
    const rasi = RASI[Math.floor(lonVal/30)];
    const deg = (lonVal % 30).toFixed(2);
    return `<tr><td>${name}</td><td>${rasi}</td><td>${deg}°</td></tr>`;
  }).join('');

  document.getElementById('jathagamResult').classList.remove('hidden');
}

/* Rasi Palan */
const RASI_PALAN_POOL = [
  "இன்று புதிய வாய்ப்புகள் தேடி வரும், தைரியமாக முடிவெடுங்கள்.",
  "குடும்பத்துடன் நல்ல நேரம் செலவிட வாய்ப்பு உள்ளது.",
  "பண பரிவர்த்தனையில் கவனம் தேவை, அவசர முடிவுகளை தவிர்க்கவும்.",
  "தொழிலில் முன்னேற்றம் தென்படும், கடின உழைப்பு பலன் தரும்.",
  "ஆரோக்கியத்தில் சிறிது கவனம் செலுத்துங்கள், ஓய்வு அவசியம்.",
  "நண்பர்கள் மூலம் நல்ல செய்தி எதிர்பார்க்கலாம்.",
  "பயணங்களுக்கு ஏற்ற நாள், புதிய இடங்களை ஆராயுங்கள்.",
  "படிப்பு/பயிற்சியில் கவனம் குவித்தால் சிறந்த பலன் கிடைக்கும்."
];

function dayOfYear(d){
  const start = new Date(Date.UTC(d.getUTCFullYear(),0,0));
  return Math.floor((d - start)/86400000);
}

function renderRasiPalan(){
  const today = new Date();
  const doy = dayOfYear(today);
  const grid = document.getElementById('rasiGrid');
  grid.innerHTML = RASI.map((rasi, idx)=>{
    const palan = RASI_PALAN_POOL[(doy+idx) % RASI_PALAN_POOL.length];
    return `<div class="rasi-card"><h3>${rasi}</h3><p>${palan}</p></div>`;
  }).join('');
}

/* Porutham */
function taraBalam(boyIdx, girlIdx){
  const countForward = (a,b)=> ((b-a+27)%27)+1;
  const c1 = countForward(boyIdx, girlIdx);
  const c2 = countForward(girlIdx, boyIdx);
  const badRemainders = [3,5,7];
  const r1 = c1 % 9, r2 = c2 % 9;
  const good = !badRemainders.includes(r1) && !badRemainders.includes(r2);
  return { c1, c2, good };
}

function renderStarSelects(){
  const boy = document.getElementById('starBoy');
  const girl = document.getElementById('starGirl');
  const opts = NAKSHATRA.map((n,i)=>`<option value="${i}">${n}</option>`).join('');
  boy.innerHTML = opts;
  girl.innerHTML = opts;
}

function handlePoruthamCheck(){
  const boyIdx = parseInt(document.getElementById('starBoy').value);
  const girlIdx = parseInt(document.getElementById('starGirl').value);
  const result = taraBalam(boyIdx, girlIdx);
  const box = document.getElementById('poruthamResult');
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3>${result.good ? "✅ தார பலம் பொருந்துகிறது" : "⚠️ தார பலத்தில் குறை உள்ளது"}</h3>
    <p>${NAKSHATRA[boyIdx]} → ${NAKSHATRA[girlIdx]}: எண்ணிக்கை ${result.c1}<br>
    ${NAKSHATRA[girlIdx]} → ${NAKSHATRA[boyIdx]}: எண்ணிக்கை ${result.c2}</p>
    <p>${result.good ? "இந்த இரு நட்சத்திரங்களுக்கும் இடையே அடிப்படை தார பலப் பொருத்தம் நல்ல முறையில் அமைந்துள்ளது." : "விபத், பிரத்யக் அல்லது நைதன தாரையில் விழுவதால் கூடுதல் கவனம் தேவை."}</p>
  `;
}

/* Static Lists */
const FESTIVALS_2026 = [
  ["ஜன. 14", "தை பொங்கல்"],
  ["ஜன. 15", "மாட்டுப் பொங்கல்"],
  ["பிப். 15", "தை பூசம்"],
  ["மார்ச் 4", "மகா சிவராத்திரி"],
  ["ஏப்ரல் 14", "தமிழ் புத்தாண்டு"],
  ["ஏப்ரல் 22", "சித்திரை விஷு"],
  ["ஆக. 15", "ஆடி பெருக்கு"],
  ["ஆக. 28", "வினாயகர் சதுர்த்தி"],
  ["அக். 21", "நவராத்திரி தொடக்கம்"],
  ["அக். 30", "விஜயதசமி"],
  ["நவ. 8", "தீபாவளி"],
  ["டிச. 31", "மார்கழி மாத தொடக்கம்"]
];

const MUHURTHAM_2026 = [
  ["ஜன. 22", "திருமணம் - சுப முகூர்த்தம்"],
  ["பிப். 5", "கிரகப்பிரவேசம்"],
  ["ஏப்ரல் 26", "திருமணம் - சுப முகூர்த்தம்"],
  ["மே 10", "வாகன வாங்குதல்"],
  ["ஜூன் 3", "தொழில் தொடக்கம்"],
  ["ஆக. 12", "காது குத்து விழா"],
  ["செப். 9", "கிரகப்பிரவேசம்"],
  ["நவ. 25", "திருமணம் - சுப முகூர்த்தம்"]
];

function renderStaticLists(){
  document.getElementById('festList').innerHTML = FESTIVALS_2026.map(([d,n]) =>
    `<div class="fest-item"><div class="fdate">${d}</div><div class="fname">${n}</div></div>`).join('');
  document.getElementById('muhurthamList').innerHTML = MUHURTHAM_2026.map(([d,n]) =>
    `<div class="muh-item"><div class="mdate">${d}</div><div class="mname">${n}</div></div>`).join('');
}

/* Nav Toggle */
document.getElementById('navToggle')?.addEventListener('click', () => {
  document.querySelector('.main-nav').classList.toggle('open');
});

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('dateInput');
  dateInput.value = new Date().toISOString().slice(0,10);

  renderToday();
  renderRasiPalan();
  renderStarSelects();
  renderStaticLists();

  document.getElementById('goBtn').addEventListener('click', renderToday);
  document.getElementById('cityInput').addEventListener('change', renderToday);
  document.getElementById('jathagamForm').addEventListener('submit', handleJathagamSubmit);
  document.getElementById('checkPorutham').addEventListener('click', handlePoruthamCheck);
});