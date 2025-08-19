import { addDoc, collection, doc, db, getAuth } from "./firebase.js";

const save = document.getElementById("save");
const reset = document.getElementById("reset");
const gamemode = document.getElementById("gamemode");

gamemode.addEventListener("change", () => {
  const playersInput = document.getElementById("players");
  const lvlInput = document.getElementById("lvl");
  const pumpbilityDisplay = document.querySelector(".pumpbility");
  if (gamemode.value === "coop") {
    playersInput.style.display = "block";
    lvlInput.style.display = "none";
    pumpbilityDisplay.style.display = "none"; // might consider allowing pumpbility to be calculated for coop, but not rn.
  } else {
    playersInput.style.display = "none";
    lvlInput.style.display = "block";
    pumpbilityDisplay.style.display = "block";
  }
});

reset.addEventListener("click", () => {
  window.location.reload();
});

const gradeTable = [
  { grade: "SSS+", score: 995000 },
  { grade: "SSS", score: 990000 },
  { grade: "SS+", score: 985000 },
  { grade: "SS", score: 980000 },
  { grade: "S+", score: 975000 },
  { grade: "S", score: 970000 },
  { grade: "AAA+", score: 960000 },
  { grade: "AAA", score: 950000 },
  { grade: "AA+", score: 925000 },
  { grade: "AA", score: 900000 },
  { grade: "A+", score: 825000 },
  { grade: "A", score: 750000 },
  { grade: "B", score: 700000 },
  { grade: "C", score: 600000 },
  { grade: "D", score: 450000 },
  { grade: "F", score: 0 },
];

const colorTable = [
  { grade: "SSS+", color: "#00E3FF" },
  { grade: "SSS", color: "#00E3FF" },
  { grade: "SS+", color: "#FFC900" },
  { grade: "SS", color: "#FFC900" },
  { grade: "S+", color: "#FFC900" },
  { grade: "S", color: "#FFC900" },
  { grade: "AAA+", color: "#AFAFAF" },
  { grade: "AAA", color: "#AFAFAF" },
  { grade: "AA+", color: "#844400" },
  { grade: "AA", color: "#844400" },
  { grade: "A+", color: "#844400" },
  { grade: "A", color: "#844400" },
  { grade: "B", color: "#00FF90" },
  { grade: "C", color: "#00FF90" },
  { grade: "D", color: "#00FF90" },
  { grade: "F", color: "#00FF90" },
];

const clearTypeTable = [
  { clearType: "Perfect Game", color: "#00E3FF" },
  { clearType: "Ultimate Game", color: "#00E3FF" },
  { clearType: "Extreme Game", color: "#FFC900" },
  { clearType: "Superb Game", color: "#FFC900" },
  { clearType: "Marvelous Game", color: "#AFAFAF" },
  { clearType: "Talented Game", color: "#AFAFAF" },
  { clearType: "Fair Game", color: "#844400" },
  { clearType: "Rough Game", color: "#844400" },
];

const pbConstants = [ //considering nerfing this for kb users (havling it will kinda work???)
  { level: 0, pb: 0 },
  { level: 1, pb: 0 },
  { level: 2, pb: 0 },
  { level: 3, pb: 0 },
  { level: 4, pb: 0 },
  { level: 5, pb: 0 },
  { level: 6, pb: 0 },
  { level: 7, pb: 0 },
  { level: 8, pb: 0 },
  { level: 9, pb: 0 },
  { level: 10, pb: 100 },
  { level: 11, pb: 110 },
  { level: 12, pb: 130 },
  { level: 13, pb: 160 },
  { level: 14, pb: 200 },
  { level: 15, pb: 250 },
  { level: 16, pb: 310 },
  { level: 17, pb: 380 },
  { level: 18, pb: 460 },
  { level: 19, pb: 550 },
  { level: 20, pb: 650 },
  { level: 21, pb: 760 },
  { level: 22, pb: 880 },
  { level: 23, pb: 1010 },
  { level: 24, pb: 1150 },
  { level: 25, pb: 1300 },
  { level: 26, pb: 1460 },
  { level: 27, pb: 1630 },
  { level: 28, pb: 1810 },
  { level: 29, pb: 2000 },
  { level: 30, pb: 2200 },
  { level: 31, pb: 2420 },
  { level: 32, pb: 2660 }, // the last 4 arent official, but was calculated from the simple growing function.
];

const pbmultiplier = [ // will change this into a function to better link each grade to the desired multiplier
  { score: 995000, multiplier: 1.5 },
  { score: 990000, multiplier: 1.44 },
  { score: 985000, multiplier: 1.38 },
  { score: 980000, multiplier: 1.32 },
  { score: 975000, multiplier: 1.26 },
  { score: 970000, multiplier: 1.2 },
  { score: 960000, multiplier: 1.15 },
  { score: 950000, multiplier: 1.10 },
  { score: 925000, multiplier: 1.05 },
  { score: 900000, multiplier: 1.00 },
  { score: 825000, multiplier: 0.90 },
  { score: 750000, multiplier: 0.80 },
  { score: 700000, multiplier: 0.70 },
  { score: 600000, multiplier: 0.60 },
  { score: 450000, multiplier: 0.50 },
  { score: 0, multiplier: 0.40 },
];

// define the textboxes constants
const song = document.querySelector("#sn");
const playLevel = document.querySelector("#lvl");
const perfect = document.querySelector("#pf");
const great = document.querySelector("#gr");
const good = document.querySelector("#gd");
const bad = document.querySelector("#bd");
const miss = document.querySelector("#ms");
const maxCombo = document.querySelector("#mc");
const notes = document.querySelector("#nt");

function getGradeFromScore(score) {
  for (let i = 0; i < gradeTable.length; i++) {
    if (score >= gradeTable[i].score) {
      return gradeTable[i].grade;
    }
  }
  return "";
}

function getClearTypeFromJudgement(p, gr, gd, bd, ms) {
  if (gr === 0 && gd === 0 && bd === 0 && ms === 0) {
    return "Perfect Game";
  } else if (gd === 0 && bd === 0 && ms === 0) {
    return "Ultimate Game";
  } else if (bd === 0 && ms === 0) {
    return "Extreme Game";
  } else if (ms === 0) {
    return "Superb Game";
  } else if (ms <= 5) {
    return "Marvelous Game";
  } else if (ms <= 10) {
    return "Talented Game";
  } else if (ms <= 20) {
    return "Fair Game";
  } else if (ms > 20) {
    return "Rough Game";
  }
  return "";
}

function getPumpbilityFromLevel(playLevel, score) {
  let level = Number(playLevel.value);
  if (level >= 33) {
    level = 32;
  }
  const pbObj = pbConstants.find(pb => pb.level === level);
  const pb = pbObj ? pbObj.pb : 0;

  // Find the highest score threshold less than or equal to the actual score
  let multiplier = 0.4; // default to lowest multiplier
  for (let i = 0; i < pbmultiplier.length; i++) {
    if (score >= pbmultiplier[i].score) {
      multiplier = pbmultiplier[i].multiplier;
      break;
    }
  }
  return Math.round(pb * multiplier);
}

function calcScore() {
  const p = Number(perfect.value);
  const gr = Number(great.value);
  const gd = Number(good.value);
  const bd = Number(bad.value);
  const ms = Number(miss.value);
  const mc = Number(maxCombo.value);
  let nt = Number(notes.value);

  if (p + gr + gd + bd + ms !== nt) {
    nt = p + gr + gd + bd + ms;
    document.querySelector("#nt").value = nt;
    return;
  }

  if (
    !isNaN(p) && !isNaN(gr) && !isNaN(gd) && !isNaN(bd) && !isNaN(ms) &&
    !isNaN(mc) && !isNaN(nt) &&
    nt > 0
  ) {
    const totalNotes = p + gr + gd + bd + ms;
    const usedNotes = Math.min(totalNotes, nt);

    const judgeWeighted = p * 1.0 + gr * 0.6 + gd * 0.2 + bd * 0.1;
    const judgeScore = usedNotes > 0 ? judgeWeighted / usedNotes : 0;
    const comboScore = nt > 0 ? Math.max(0, Math.min(mc, nt)) / nt : 0;

    const score = Math.round(judgeScore * 995000 + comboScore * 5000);
    const failCheckbox = document.getElementById("chartFail");
    const grade = getGradeFromScore(score);
    const cleartype = getClearTypeFromJudgement(p, gr, gd, bd, ms);
    const pumpbility = failCheckbox && failCheckbox.checked === true ? 0 : getPumpbilityFromLevel(playLevel, score);

    document.querySelector(".score").innerHTML = `Score: ${score}`;
    document.querySelector(".grade").innerHTML = `${grade}`;
    if (failCheckbox && failCheckbox.checked === true) {
      document.querySelector(".grade").style.color = "#888888";
      document.querySelector(".cleartype").innerHTML = "<br>";
      document.querySelector(".pumpbility").innerHTML = "Pumpbility: 0";
    } else {
      const gradeColor = colorTable.find(color => color.grade === grade)?.color || "#000";
      const cleartypeColor = clearTypeTable.find(obj => obj.clearType === cleartype)?.color || "#000";
      document.querySelector(".grade").style.color = gradeColor;
      document.querySelector(".cleartype").innerHTML = `${cleartype}`;
      document.querySelector(".cleartype").style.color = `${cleartypeColor}`;
      document.querySelector(".pumpbility").innerHTML = `Pumpbility: ${pumpbility}`;
    }
    return score;
  }
}

save.addEventListener("click", () => {
  uploadScore();
});

async function uploadScore() {
  const sn = document.querySelector("#sn").value;
  const lvl = document.querySelector("#lvl").value;
  const pf = document.querySelector("#pf").value;
  const gr = document.querySelector("#gr").value;
  const gd = document.querySelector("#gd").value;
  const bd = document.querySelector("#bd").value;
  const ms = document.querySelector("#ms").value;
  const mc = document.querySelector("#mc").value;
  const nt = document.querySelector("#nt").value;
  const fa = document.querySelector("#fa").value;
  const sl = document.querySelector("#sl").value;
  const isSuperbOn = document.querySelector("#isSuperbOn").checked;
  const chartFail = document.querySelector("#chartFail").checked;
  const auth = getAuth();


  const playMode = document.getElementById("gamemode").value;
  const players = document.getElementById("players").value;
  const playModeLetter = playMode === "coop" ? `Co-op x${players}` : playMode.charAt(0).toUpperCase(); // ensure the correct level display notation
  // Calculate score, grade, cleartype, pumpbility for upload
  const p = Number(pf);
  const g = Number(gr);
  const go = Number(gd);
  const b = Number(bd);
  const m = Number(ms);
  const mcNum = Number(mc);
  const ntNum = Number(nt);

  // Defensive: if notes is 0, don't upload
  if (isNaN(ntNum) || ntNum <= 0) {
    alert("Please enter a valid number of notes.");
    return;
  }

  // Defensive: if any field is NaN, don't upload
  if ([p, g, go, b, m, mcNum].some(x => isNaN(x))) {
    alert("Please fill in all judgement and combo fields.");
    return;
  }

  // Score calculation logic (same as calcScore)
  const totalNotes = p + g + go + b + m;
  const usedNotes = Math.min(totalNotes, ntNum);
  const judgeWeighted = p * 1.0 + g * 0.6 + go * 0.2 + b * 0.1;
  const judgeScore = usedNotes > 0 ? judgeWeighted / usedNotes : 0;
  const comboScore = ntNum > 0 ? Math.max(0, Math.min(mcNum, ntNum)) / ntNum : 0;
  const scoreValue = Math.round(judgeScore * 995000 + comboScore * 5000);
  const grade = getGradeFromScore(scoreValue);
  const cleartype = getClearTypeFromJudgement(p, g, go, b, m);
  const pumpbility = chartFail || playMode === "coop" ? 0 : getPumpbilityFromLevel({ value: lvl }, scoreValue); // pumpbility is 0 if the chart fails or is coop

  const scoreObj = {
    sn: sn,
    lvl: playMode === "coop" ? `Co-op x${players}` : playModeLetter + lvl, //ensure the correct level display notation
    pf: pf,
    gr: gr,
    gd: gd,
    bd: bd,
    ms: ms,
    mc: mc,
    fa: fa,
    sl: sl,
    score: scoreValue,
    grade: grade,
    cleartype: cleartype,
    chartFail: chartFail,
    isSuperbOn: isSuperbOn,
    pumpbility: pumpbility,
    timestamp: Date.now(),
    timeString: new Date().toLocaleString('en-GB', { hour12: false }),
  };

  try {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to upload a score.");
      return;
    }
    const userKey = user.uid;


    // Add the score to the user's scores subcollection
    await addDoc(collection(db, "users", userKey, "scores"), scoreObj);
    alert("Score uploaded successfully");
    window.location.href = `/score.html?user=${user.displayName}&sn=${sn}&lvl=${scoreObj.lvl}&t=${scoreObj.timestamp}`;
  } catch (error) {
    console.error("Error uploading score:", error);
    alert("Error uploading score. Please try again.");
  }
}

export { calcScore }