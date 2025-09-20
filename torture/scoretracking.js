import { addDoc, collection, doc, db, getAuth, getDoc, setDoc, query, where, getDocs } from "./firebase.js";

const save = document.getElementById("save");
const reset = document.getElementById("reset");
const gamemode = document.getElementById("gamemode");
const rate = document.getElementById("rate");
document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      document.querySelector(".scorecontainer").innerHTML = "You must be logged in to upload a score.";
      document.querySelector(".scorecontainer").style.textAlign = "center";
      document.querySelector(".scorecontainer").style.fontSize = "1.5em";
      document.querySelector(".scorecontainer").style.marginTop = "100px";
      document.querySelector(".scorecontainer").style.display = "flex";
      document.querySelector(".scorecontainer").style.flexDirection = "column";
      document.querySelector(".scorecontainer").style.justifyContent = "center";
      document.querySelector(".title").style.display = "none";
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.role === "banned") {
          document.querySelector(".scorecontainer").innerHTML = "You have been banned from the site and cannot upload scores.";
          document.querySelector(".scorecontainer").style.textAlign = "center";
          document.querySelector(".scorecontainer").style.fontSize = "1.5em";
          document.querySelector(".scorecontainer").style.marginTop = "100px";
          document.querySelector(".scorecontainer").style.display = "flex";
          document.querySelector(".scorecontainer").style.flexDirection = "column";
          document.querySelector(".scorecontainer").style.justifyContent = "center";
          document.querySelector(".title").style.display = "none";
          return;
        }
      }
    } catch (e) {
      console.error("Error checking user role:", e);
      alert("An error occurred while checking your account status. Please try again later.");
      return;
    }
  });
});
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


song.addEventListener("input",
  async () => {
    let songquery = song.value.toLowerCase().replace(/ /g, "");  // convert to all lowercase, no spaces
    const songsRef = collection(db, "songs");

    let songDocSnap = await getDoc(doc(db, "songs", songquery));
    let songData = songDocSnap.exists() ? songDocSnap.data() : null;
    if (!songData) {
      const q = query(songsRef, where("name", "==", songquery));
      const querySnapshot = await getDocs(q);
      songData = querySnapshot.docs.length > 0 ? querySnapshot.docs[0].data() : null;
    }


    if (!songData) {
      document.querySelector(".newsong").innerHTML = "⚠️This song is not in the database yet. You can still upload a score, but it will need to be approved by an admin first. Please check for typos if you believe this is an error.";
      document.querySelector(".bannerdisp").style.display = "none";
      document.querySelector(".banner").src = "";
      document.querySelector(".name").innerHTML = song.value || "";
      document.querySelector(".artist").innerHTML = "";
      document.querySelector(".series").innerHTML = "";
      return;
    }
    if (songData) {
      document.querySelector(".newsong").innerHTML = "";
      document.querySelector(".banner").src = songData.banner || "/img/nobanner.png";
      document.querySelector(".bannerdisp").style.display = "block";
      document.querySelector(".name").innerHTML = songData.name || "";
      document.querySelector(".artist").innerHTML = songData.artist || "Unknown artist";
      document.querySelector(".series").innerHTML = songData.series || "Unknown series";
    }
  }
);


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
  if (isNaN(level) || level < 1) {
    return 0;
  }
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
  let rateValue = 1.0;
  if (rate && typeof rate.value !== "undefined" && rate.value !== "") {
    rateValue = Number(rate.value);
    if (isNaN(rateValue) || rateValue <= 0) {
      rateValue = 1.0;
    }
  }
  multiplier *= Math.pow(rateValue, 1.03); // reward pumpbility for higher rates, keeping the multiplier *somewhat* linear
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

  const proofListings = document.querySelectorAll(".proof");
  const proofListingsObj = [];
  proofListings.forEach(proof => {
    if (proof.querySelector("select").value === "none" && proof.querySelector('input[type="text"]').value !== "") {
      alert("Please select a proof type.");
      return;
    }
    const proofType = proof.querySelector("select").value;
    const proofLink = proof.querySelector('input[type="text"]').value;
    const proofObj = {
      proof: proofType,
      link: proofLink,
    };
    proofListingsObj.push(proofObj);
  });

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
  const userDocSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
  const noLeaderboards = userDocSnap.data().excludedfromleaderboards === true ? true : false;
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
    rate: rate.value ? rate.value : 1,
    grade: grade,
    cleartype: chartFail ? "" : cleartype,
    chartFail: chartFail,
    isSuperbOn: isSuperbOn,
    pumpbility: chartFail || playMode === "coop" ? 0 : pumpbility,
    timestamp: Date.now(),
    timeString: new Date().toLocaleString('en-GB', { hour12: false }),
    pending: true, // this is used to determine if the score is pending approval
    nolb: noLeaderboards, // this is used to determine if the score is not allowed to be shown on the leaderboard
    proof: proofListingsObj,
  };

  try {
    const songKey = sn.toLowerCase().replace(/ /g, "");
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to upload a score.");
      return;
    }
    const userKey = user.uid;


    // Add the score to the user's scores subcollection
    await addDoc(collection(db, "users", userKey, "scores"), scoreObj);
    await setDoc(doc(db, "songs", songKey),{
      name: sn,
      // artist: scoreData.artist, //adding this later
      // series: scoreData.series, //adding this later
    }, { merge: true });
    if (noLeaderboards) {
      await addDoc(collection(db, "songs", songKey, "scores"), {...scoreObj, player: user.displayName, nolb: true});
    } else {
      await addDoc(collection(db, "songs", songKey, "scores"), {...scoreObj, player: user.displayName});
    }
    alert("Score uploaded successfully");
    window.location.href = `/score.html?user=${user.displayName}&sn=${sn}&lvl=${scoreObj.lvl}&t=${scoreObj.timestamp}`;
  } catch (error) {
    console.error("Error uploading score:", error);
    alert("Error uploading score. Please try again.");
  }
}

function addProof() {
  // Find the proofcontainer (the div with class "proofcontainer")
  const proofContainer = document.querySelector(".proofcontainer");
  if (!proofContainer) return;

  // Count current .proof instances to generate unique IDs
  const proofInstanceCount = proofContainer.querySelectorAll(".proof").length;
  const proofDiv = document.createElement("div");
  proofDiv.className = "proof";

  // Build the inner HTML for the new proof entry
  proofDiv.innerHTML = `
    <select name="proof" id="proof${proofInstanceCount + 1}" style="width: 100px;">
      <option value="none">Select...</option>
      <option value="video">Video</option>
      <option value="screenshot">Screenshot</option>
      <option value="other">Other</option>
    </select>
    <input type="text" placeholder="Link to proof" id="proofLink${proofInstanceCount + 1}" autocomplete="off" />
    <button class="removeProof" type="button">Remove proof</button>
  `;

  // Add event listener for the remove button only (no addProof button in dynamic proofDiv)
  proofDiv.querySelector(".removeProof").addEventListener("click", function () {
    removeProof(proofDiv);
  });

  proofContainer.appendChild(proofDiv);
}

function removeProof(proofElement) {
  if (proofElement && proofElement.parentNode) {
    proofElement.parentNode.removeChild(proofElement);
  }
}

export { calcScore, addProof, removeProof }