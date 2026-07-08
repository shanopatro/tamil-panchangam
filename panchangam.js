/* ==========================================================================
   கடல்நிலா பஞ்சாங்கம் - Astronomy & Panchangam Engine
   Low-precision Sun/Moon formulas (Meeus-derived, ~1 arcmin accuracy) +
   Lahiri Ayanamsa. Good enough for tithi/nakshatra to within a few minutes.
   All internal time is UTC; IST (UTC+5:30) is used only for display &
   for interpreting which "civil day" a calculation belongs to.
   ========================================================================== */

const IST_OFFSET_MIN = 330; // +5:30

/* ---------- location (default: Nagapattinam) ---------- */
const DEFAULT_LOCATION = { name: "நாகப்பட்டினம்", lat: 10.7661, lon: 79.8420 };

/* ---------- generic helpers ---------- */
function normalize360(x) { x = x % 360; if (x < 0) x += 360; return x; }
function deg2rad(d) { return d * Math.PI / 180; }
function rad2deg(r) { return r * 180 / Math.PI; }

// Build a UTC Date from an IST calendar date + IST decimal hour
function istToUTCDate(y, m, d, istHourDecimal) {
  const totalMin = Math.round(istHourDecimal * 60) - IST_OFFSET_MIN;
  return new Date(Date.UTC(y, m - 1, d, 0, totalMin));
}
// Convert a UTC Date instant to {y,m,d,hourDecimal} in IST for display
function utcToIST(dateUTC) {
  const shifted = new Date(dateUTC.getTime() + IST_OFFSET_MIN * 60000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    hh: shifted.getUTCHours(),
    mm: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay()
  };
}
function fmtTime(dateUTC) {
  if (!dateUTC) return "—";
  const t = utcToIST(dateUTC);
  const h12 = ((t.hh % 12) === 0) ? 12 : (t.hh % 12);
  const ampm = t.hh < 12 ? "AM" : "PM";
  return `${String(h12).padStart(2,"0")}:${String(t.mm).padStart(2,"0")} ${ampm}`;
}
function fmtDateTime(dateUTC) {
  if (!dateUTC) return "—";
  const t = utcToIST(dateUTC);
  return `${String(t.d).padStart(2,"0")}-${String(t.m).padStart(2,"0")}-${t.y}, ${fmtTime(dateUTC)}`;
}
function jdFromUTCDate(dateUTC) { return dateUTC.getTime() / 86400000 + 2440587.5; }
function dayOfYearUTC(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const cur = Date.UTC(y, m - 1, d);
  return Math.floor((cur - start) / 86400000) + 1;
}
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

/* ---------- Sun / Moon longitude (tropical, apparent, low precision) ---------- */
function sunLongitudeDeg(T) {
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = deg2rad(M);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
          + 0.000289 * Math.sin(3 * Mr);
  return normalize360(L0 + C);
}

function moonLongitudeDeg(T) {
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T*T*T/538841 - T*T*T*T/65194000;
  const D  = 297.8501921 + 445267.1114034  * T - 0.0018819 * T * T + T*T*T/545868 - T*T*T*T/113065000;
  const M  = 357.5291092 + 35999.0502909   * T - 0.0001536 * T * T + T*T*T/24490000;
  const Mp = 134.9633964 + 477198.8675055  * T + 0.0087414 * T * T + T*T*T/69699  - T*T*T*T/14712000;
  const F  = 93.2720950  + 483202.0175233  * T - 0.0036539 * T * T - T*T*T/3526000 + T*T*T*T/863310000;
  const r = Math.PI / 180;

  const dL =
      6288774 * Math.sin(r*(Mp))
    + 1274027 * Math.sin(r*(2*D - Mp))
    +  658314 * Math.sin(r*(2*D))
    +  213618 * Math.sin(r*(2*Mp))
    -  185116 * Math.sin(r*(M))
    -  114332 * Math.sin(r*(2*F))
    +   58793 * Math.sin(r*(2*D - 2*Mp))
    +   57066 * Math.sin(r*(2*D - M - Mp))
    +   53322 * Math.sin(r*(2*D + Mp))
    +   45758 * Math.sin(r*(2*D - M))
    -   40923 * Math.sin(r*(M - Mp))
    -   34720 * Math.sin(r*(D))
    -   30383 * Math.sin(r*(M + Mp))
    +   15327 * Math.sin(r*(2*D - 2*F))
    -   12528 * Math.sin(r*(Mp + 2*F))
    +   10980 * Math.sin(r*(Mp - 2*F))
    +   10675 * Math.sin(r*(4*D - Mp))
    +   10034 * Math.sin(r*(3*Mp))
    +    8548 * Math.sin(r*(4*D - 2*Mp))
    -    7888 * Math.sin(r*(2*D + M - Mp))
    -    6766 * Math.sin(r*(2*D + M))
    -    5163 * Math.sin(r*(D - Mp))
    +    4987 * Math.sin(r*(D + M))
    +    4036 * Math.sin(r*(2*D - M + Mp))
    +    3994 * Math.sin(r*(2*D + 2*Mp))
    +    3861 * Math.sin(r*(4*D))
    +    3665 * Math.sin(r*(2*D - 3*Mp))
    -    2689 * Math.sin(r*(M - 2*Mp))
    -    2602 * Math.sin(r*(2*D - Mp - 2*F));

  return normalize360(Lp + dL / 1000000);
}

// Lahiri Ayanamsa (linear approximation, good to ~0.01 deg over a couple decades)
function lahiriAyanamsa(T) {
  const year = 2000 + T * 100;
  return 23.85 + (year - 2000) * 0.013972;
}

function TfromUTC(dateUTC) { return (jdFromUTCDate(dateUTC) - 2451545.0) / 36525; }

function elongationDeg(dateUTC) {
  const T = TfromUTC(dateUTC);
  return normalize360(moonLongitudeDeg(T) - sunLongitudeDeg(T));
}
function siderealMoonDeg(dateUTC) {
  const T = TfromUTC(dateUTC);
  return normalize360(moonLongitudeDeg(T) - lahiriAyanamsa(T));
}
function siderealSunPlusMoonDeg(dateUTC) {
  const T = TfromUTC(dateUTC);
  const ay = lahiriAyanamsa(T);
  return normalize360((sunLongitudeDeg(T) - ay) + (moonLongitudeDeg(T) - ay));
}

/* ---------- Sunrise / Sunset (classic almanac algorithm, ~1-2 min accuracy) ---------- */
function sunriseSunsetUT(y, m, d, lat, lon) {
  const N = dayOfYearUTC(y, m, d);
  const lngHour = lon / 15;
  const zenith = 90.833;
  const r = Math.PI / 180, dg = 180 / Math.PI;

  function compute(isRise) {
    const t = N + ((isRise ? 6 : 18) - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    let L = M + 1.916 * Math.sin(M * r) + 0.020 * Math.sin(2 * M * r) + 282.634;
    L = normalize360(L);
    let RA = dg * Math.atan(0.91764 * Math.tan(L * r));
    RA = normalize360(RA);
    const Lq = Math.floor(L / 90) * 90;
    const RAq = Math.floor(RA / 90) * 90;
    RA = (RA + (Lq - RAq)) / 15;
    const sinDec = 0.39782 * Math.sin(L * r);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(zenith * r) - sinDec * Math.sin(lat * r)) / (cosDec * Math.cos(lat * r));
    if (cosH > 1 || cosH < -1) return null; // polar edge case, not relevant for TN
    let H = isRise ? 360 - dg * Math.acos(cosH) : dg * Math.acos(cosH);
    H = H / 15;
    const T2 = H + RA - 0.06571 * t - 6.622;
    let UT = T2 - lngHour;
    UT = ((UT % 24) + 24) % 24;
    return UT;
  }
  return { riseUT: compute(true), setUT: compute(false) };
}

// Returns {sunrise: Date(UTC), sunset: Date(UTC)} for a given IST calendar date
function getSunTimes(y, m, d, lat, lon) {
  const { riseUT, setUT } = sunriseSunsetUT(y, m, d, lat, lon);
  const mk = (ut) => new Date(Date.UTC(y, m - 1, d, Math.floor(ut), Math.round((ut % 1) * 60)));
  return { sunrise: riseUT !== null ? mk(riseUT) : null, sunset: setUT !== null ? mk(setUT) : null };
}

/* ---------- Names ---------- */
const TITHI_NAMES = ["பிரதமை","துவிதியை","திரிதியை","சதுர்த்தி","பஞ்சமி","சஷ்டி","சப்தமி",
  "அஷ்டமி","நவமி","தசமி","ஏகாதசி","துவாதசி","திரயோதசி","சதுர்த்தசி"];
const NAKSHATRA_NAMES = ["அஸ்வினி","பரணி","கார்த்திகை","ரோகிணி","மிருகசீரிடம்","திருவாதிரை","புனர்பூசம்",
  "பூசம்","ஆயில்யம்","மகம்","பூரம்","உத்திரம்","ஹஸ்தம்","சித்திரை","சுவாதி","விசாகம்","அனுஷம்","கேட்டை",
  "மூலம்","பூராடம்","உத்திராடம்","திருவோணம்","அவிட்டம்","சதயம்","பூரட்டாதி","உத்திரட்டாதி","ரேவதி"];
const YOGA_NAMES = ["விஷ்கம்பம்","பிரீதி","ஆயுஷ்மான்","சௌபாக்கியம்","சோபனம்","அதிகண்டம்","சுகர்மா","திருதி",
  "சூலம்","கண்டம்","விருத்தி","துருவம்","வியாகாதம்","ஹர்ஷணம்","வஜ்ரம்","சித்தி","வியதீபாதம்","வரீயான்",
  "பரிகம்","சிவம்","சித்தம்","சாத்தியம்","சுபம்","சுக்லம்","பிரம்மம்","ஐந்திரம்","வைதிருதி"];
const KARANA_MOVABLE = ["பவ","பாலவ","கௌலவ","தைதுல","கரஜ","வணிஜ","விஷ்டி"];
const KARANA_FIXED = ["சகுனி","சதுஷ்பாதம்","நாகவம்"];
const WEEKDAY_NAMES = ["ஞாயிற்றுக்கிழமை","திங்கட்கிழமை","செவ்வாய்க்கிழமை","புதன்கிழமை","வியாழக்கிழமை","வெள்ளிக்கிழமை","சனிக்கிழமை"];
const TAMIL_MONTHS = ["சித்திரை","வைகாசி","ஆனி","ஆடி","ஆவணி","புரட்டாசி","ஐப்பசி","கார்த்திகை","மார்கழி","தை","மாசி","பங்குனி"];

function tithiFromElongation(elong) {
  const idx = Math.floor(elong / 12); // 0-29
  const paksha = idx < 15 ? "சுக்ல பட்சம்" : "கிருஷ்ண பட்சம்";
  let name;
  if (idx === 14) name = "பௌர்ணமி";
  else if (idx === 29) name = "அமாவாசை";
  else name = TITHI_NAMES[idx % 15];
  return { index: idx, num: (idx % 15) + 1, paksha, name };
}
function nakshatraFromSidereal(sid) {
  const step = 360 / 27;
  const idx = Math.floor(sid / step);
  const pada = Math.floor((sid % step) / (step / 4)) + 1;
  return { index: idx, name: NAKSHATRA_NAMES[idx], pada };
}
function yogaFromValue(val) {
  const step = 360 / 27;
  const idx = Math.floor(normalize360(val) / step);
  return { index: idx, name: YOGA_NAMES[idx] };
}
function karanaFromElongation(elong) {
  const num = Math.floor(elong / 6); // 0-59
  let name;
  if (num === 0) name = "கிம்ஸ்துக்னம்";
  else if (num >= 57) name = KARANA_FIXED[num - 57];
  else name = KARANA_MOVABLE[(num - 1) % 7];
  return { index: num, name };
}

/* ---------- Full panchangam snapshot for a given moment (UTC Date) ---------- */
function panchangamAt(dateUTC) {
  const elong = elongationDeg(dateUTC);
  const sid = siderealMoonDeg(dateUTC);
  const yogaVal = siderealSunPlusMoonDeg(dateUTC);
  return {
    tithi: tithiFromElongation(elong),
    nakshatra: nakshatraFromSidereal(sid),
    yoga: yogaFromValue(yogaVal),
    karana: karanaFromElongation(elong),
    elongation: elong
  };
}

/* ---------- Rahu Kalam / Yamagandam / Kuligai ---------- */
const RAHU_PART   = [8,2,7,5,6,4,3]; // index by JS weekday (0=Sun)
const YAMA_PART   = [5,4,3,2,1,7,6];
const KULIGAI_PART= [7,6,5,4,3,2,1];

function periodFromPart(sunrise, sunset, partNum) {
  if (!sunrise || !sunset) return null;
  const dur = (sunset.getTime() - sunrise.getTime()) / 8;
  const start = new Date(sunrise.getTime() + (partNum - 1) * dur);
  const end = new Date(start.getTime() + dur);
  return { start, end };
}

function dayPeriods(y, m, d, lat, lon) {
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const { sunrise, sunset } = getSunTimes(y, m, d, lat, lon);
  const rahu = periodFromPart(sunrise, sunset, RAHU_PART[wd]);
  const yama = periodFromPart(sunrise, sunset, YAMA_PART[wd]);
  const kuligai = periodFromPart(sunrise, sunset, KULIGAI_PART[wd]);

  // Nalla Neram (simplified): free gaps between sunrise-sunset once Rahu/Yama/Kuligai removed
  let nallaNeram = [];
  if (sunrise && sunset) {
    const blocks = [rahu, yama, kuligai].filter(Boolean).sort((a,b)=>a.start-b.start);
    let cursor = sunrise;
    blocks.forEach(b => {
      if (b.start.getTime() > cursor.getTime()) {
        nallaNeram.push({ start: cursor, end: b.start });
      }
      if (b.end.getTime() > cursor.getTime()) cursor = b.end;
    });
    if (cursor.getTime() < sunset.getTime()) nallaNeram.push({ start: cursor, end: sunset });
    // drop very short (<20 min) slivers
    nallaNeram = nallaNeram.filter(p => (p.end - p.start) >= 20*60000);
  }

  return { sunrise, sunset, rahu, yama, kuligai, nallaNeram, weekday: wd };
}

/* ---------- Generic boundary finder (circular bisection) ---------- */
// valueFn(dateUTC) -> degrees in [0,360). Finds crossing of boundaryDeg nearest approxMs.
function findBoundaryNear(valueFn, approxMs, boundaryDeg, windowDays = 3, stepHours = 1) {
  function wrappedDiff(t) {
    const v = valueFn(new Date(t));
    let diff = v - boundaryDeg;
    diff = ((diff + 540) % 360) - 180;
    return diff;
  }
  const stepMs = stepHours * 3600000;
  const startT = approxMs - windowDays * 86400000;
  const endT = approxMs + windowDays * 86400000;
  let prevT = startT, prevF = wrappedDiff(startT);
  for (let t = startT + stepMs; t <= endT; t += stepMs) {
    const curF = wrappedDiff(t);
    if ((prevF <= 0 && curF > 0) && Math.abs(curF - prevF) < 180) {
      let lo = prevT, hi = t, flo = prevF;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        const fmid = wrappedDiff(mid);
        if ((flo <= 0 && fmid > 0)) { hi = mid; } else { lo = mid; flo = fmid; }
      }
      return new Date((lo + hi) / 2);
    }
    prevT = t; prevF = curF;
  }
  return null;
}

function tithiStartEnd(refUTCms, tithiIndex) {
  const startBoundary = tithiIndex * 12;
  const endBoundary = ((tithiIndex + 1) * 12) % 360;
  const start = findBoundaryNear(elongationDeg, refUTCms, startBoundary);
  const end = findBoundaryNear(elongationDeg, refUTCms, endBoundary);
  return { start, end };
}
function nakshatraStartEnd(refUTCms, nakIndex) {
  const step = 360 / 27;
  const startBoundary = nakIndex * step;
  const endBoundary = ((nakIndex + 1) * step) % 360;
  const start = findBoundaryNear(siderealMoonDeg, refUTCms, startBoundary);
  const end = findBoundaryNear(siderealMoonDeg, refUTCms, endBoundary);
  return { start, end };
}

/* ---------- Special occasion detection for a single IST calendar day ---------- */
// Convention: Ekadashi/Pournami/Amavasai/Shashti keyed off tithi at SUNRISE.
// Pradosham keyed off tithi (Trayodashi) at SUNSET. Karthigai keyed off
// nakshatra (Krittika) at SUNSET. This matches common practical usage.
function specialOccasionsForDay(y, m, d, lat, lon) {
  const { sunrise, sunset } = getSunTimes(y, m, d, lat, lon);
  const results = [];
  if (sunrise) {
    const pAtRise = panchangamAt(sunrise);
    const idx = pAtRise.tithi.index;
    if (idx === 14) results.push({ type: "பௌர்ணமி", ...tithiStartEnd(sunrise.getTime(), 14) });
    if (idx === 29) results.push({ type: "அமாவாசை", ...tithiStartEnd(sunrise.getTime(), 29) });
    if (idx === 10) results.push({ type: "ஏகாதசி (சுக்ல)", ...tithiStartEnd(sunrise.getTime(), 10) });
    if (idx === 25) results.push({ type: "ஏகாதசி (கிருஷ்ண)", ...tithiStartEnd(sunrise.getTime(), 25) });
    if (idx === 5) results.push({ type: "சஷ்டி (சுக்ல)", ...tithiStartEnd(sunrise.getTime(), 5) });
    if (idx === 20) results.push({ type: "சஷ்டி (கிருஷ்ண)", ...tithiStartEnd(sunrise.getTime(), 20) });
  }
  if (sunset) {
    const pAtSet = panchangamAt(sunset);
    const tIdx = pAtSet.tithi.index;
    if (tIdx === 12) results.push({ type: "பிரதோஷம் (சுக்ல)", ...tithiStartEnd(sunset.getTime(), 12) });
    if (tIdx === 27) results.push({ type: "பிரதோஷம் (கிருஷ்ண)", ...tithiStartEnd(sunset.getTime(), 27) });
    const nIdx = pAtSet.nakshatra.index;
    if (nIdx === 2) results.push({ type: "கார்த்திகை", ...nakshatraStartEnd(sunset.getTime(), 2) });
  }
  return results;
}