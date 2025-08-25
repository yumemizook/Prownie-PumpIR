import {
  getAuth,
  onAuthStateChanged,
  getDoc,
  doc,
  db,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  addDoc,
  setDoc,
} from "./firebase.js";
let formatDistanceToNow;
const playerName = document.querySelector("[playername]");
const playerAvatar = document.querySelector("#playerpfp");
const pumpbility = document.querySelector("#pbility");
const role = document.querySelector(".role");
const timecreated = document.querySelector(".timecreated");
const stats = document.querySelector(".stats");
const statsbutton = document.querySelector("#statistics");
const addtoLB = document.querySelector(".addtoLB");

const pumpbilityColors = [
  { pumpbility: 0, color: "rgb(183, 250, 255)" },
  { pumpbility: 2000, color: "rgb(47, 154, 255)" },
  { pumpbility: 4000, color: "rgb(0, 255, 115)" },
  { pumpbility: 6000, color: "rgb(141, 255, 47)" },
  { pumpbility: 8000, color: "rgb(255, 255, 125)" },
  { pumpbility: 10000, color: "rgb(255, 12, 12)" },
  { pumpbility: 12000, color: "rgb(153, 0, 255)" },
  { pumpbility: 15000, color: "rgb(133, 102, 0)" },
  { pumpbility: 20000, color: "rgb(179, 179, 179)" },
  { pumpbility: 24000, color: "rgb(255, 238, 0)" },
  { pumpbility: 26000, color: "rgb(143, 212, 203)" },
  {
    pumpbility: 30000,
    color:
      "linear-gradient(90deg, rgb(255, 87, 87) 0%, rgb(255, 190, 92) 20%, rgba(208, 222, 33, 1) 40%, rgb(171, 255, 138) 60%, rgb(100, 255, 162) 80%, rgba(47, 201, 226, 1) 100%",
  },
  {
    pumpbility: 35000,
    color:
      "linear-gradient(90deg,rgba(251, 255, 8, 1) 0%, rgba(255, 3, 255, 1) 25%, rgba(0, 38, 255, 1) 50%, rgba(0, 242, 255, 1) 75%, rgba(0, 255, 170, 1) 100%)",
  },
];

function getPumpbilityColor(value) {
  // Find the highest pumpbility threshold not exceeding value
  let lastColor = pumpbilityColors[0].color;
  for (const entry of pumpbilityColors) {
    if (value >= entry.pumpbility) {
      lastColor = entry.color;
    } else {
      break;
    }
  }
  return lastColor;
}

function setRoleText(roleElem, userRole) {
  switch (userRole) {
    case "owner":
      roleElem.innerHTML =
        "<span style='color:rgb(255, 125, 125);'>----- The sole creator of this website -----</span>";
      break;
    case "sysop":
      roleElem.innerHTML =
        "<span style='color:rgb(82, 212, 255);'>---- The twin of Don ----</span>";
      break;
    case "admin":
      roleElem.innerHTML =
        "<span style='color:rgb(215, 255, 82);'>--- Admin ---</span>";
      break;
    case "moderator":
      roleElem.innerHTML =
        "<span style='color:rgb(146, 82, 255);'>-- Leaderboard Moderator --</span>";
      break;
    case "veteran":
      roleElem.innerHTML =
        "<span style='color:rgb(255, 146, 82);'>- Leg of God -</span>";
      break;
    case "banned":
      roleElem.innerHTML =
        "<span style='color:rgb(121, 121, 121);'>Banned.</span> <br> This account has been banned from the site.";
      break;
    case "user":
    default:
      roleElem.innerHTML = "";
      break;
  }
}

async function getHardestDifficulty(uid) {
  try {
    const scoresRef = collection(db, "users", uid, "scores");
    const scoresSnapshot = await getDocs(scoresRef);

    if (scoresSnapshot.empty) {
      return "No plays";
    }

    // Filter out failed charts and find the highest level
    let highestLevel = 0;
    scoresSnapshot.forEach((doc) => {
      const scoreData = doc.data();
      if (scoreData.chartFail !== true && scoreData.chartFail !== "true") {
        let level = 0;
        if (typeof scoreData.lvl === "number") {
          level = scoreData.lvl;
        } else if (typeof scoreData.lvl === "string") {
          // Remove any non-digit prefix (e.g., "L15" or "15")
          const match = scoreData.lvl.match(/\d+/);
          if (match) {
            level = Number(match[0]);
          }
        }
        if (level > highestLevel) {
          highestLevel = level;
        }
      }
    });

    return highestLevel > 0 ? highestLevel : "None";
  } catch (err) {
    console.error("Error fetching hardest difficulty:", err);
    return "???";
  }
}

async function getHardestPerfectGame(uid) {
  try {
    const scoresRef = collection(db, "users", uid, "scores");
    const scoresSnapshot = await getDocs(scoresRef);

    let highestLevel = 0;
    scoresSnapshot.forEach((doc) => {
      const scoreData = doc.data();
      if (scoreData.score === 1000000) {
        let level = 0;
        if (typeof scoreData.lvl === "number") {
          level = scoreData.lvl;
        } else if (typeof scoreData.lvl === "string") {
          const match = scoreData.lvl.match(/\d+/);
          if (match) {
            level = Number(match[0]);
          }
        }
        if (level > highestLevel) {
          highestLevel = level;
        }
      }
    });

    return highestLevel > 0 ? highestLevel : "None";
  } catch (err) {
    console.error("Error fetching hardest perfect game:", err);
    return "???";
  }
}

async function getHardestMax(uid) {
  try {
    const scoresRef = collection(db, "users", uid, "scores");
    const scoresSnapshot = await getDocs(scoresRef);

    let highestLevel = 0;
    scoresSnapshot.forEach((doc) => {
      const scoreData = doc.data();
      const fa = Number(scoreData.fa) || 0;
      const sl = Number(scoreData.sl) || 0;

      if (
        scoreData.score === 1000000 &&
        (scoreData.isSuperbOn === true || scoreData.isSuperbOn === "true") &&
        fa + sl === 0 &&
        scoreData.chartFail !== true &&
        scoreData.chartFail !== "true"
      ) {
        let level = 0;
        if (typeof scoreData.lvl === "number") {
          level = scoreData.lvl;
        } else if (typeof scoreData.lvl === "string") {
          const match = scoreData.lvl.match(/\d+/);
          if (match) {
            level = Number(match[0]);
          }
        }
        if (level > highestLevel) {
          highestLevel = level;
        }
      }
    });

    return highestLevel > 0 ? highestLevel : "None";
  } catch (err) {
    console.error("Error fetching hardest MAX:", err);
    return "???";
  }
}

async function getTotalScore(uid) {
  const scoresRef = collection(db, "users", uid, "scores");
  const scoresSnapshot = await getDocs(scoresRef);
  let totalScore = 0;
  scoresSnapshot.forEach((doc) => {
    const scoreData = doc.data();
    totalScore += Number(scoreData.score) || 0;
  });
  return totalScore.toLocaleString();
}

async function getClearTypeCount(uid, clearType) {
  const scoresRef = collection(db, "users", uid, "scores");
  const scoresSnapshot = await getDocs(scoresRef);
  let count = 0;
  scoresSnapshot.forEach((doc) => {
    const scoreData = doc.data();
    if (scoreData.cleartype === clearType) {
      count++;
    }
  });
  return count;
}

statsbutton.addEventListener("click", async (e) => {
  e.preventDefault();
  const statsElem = document.querySelector(".stats");
  if (statsElem.style.display === "none" || statsElem.style.display === "") {
    statsElem.style.display = "block";
  } else {
    statsElem.style.display = "none";
    return;
  }
  const user = getAuth().currentUser;
  if (!user) {
    return;
  }

  try {
    const scoresRef = collection(db, "users", user.uid, "scores");
    const count = await getCountFromServer(scoresRef);
    const playCount = count.data().count;

    const hardestDiff = await getHardestDifficulty(user.uid);
    const hardestPerfectGame = await getHardestPerfectGame(user.uid);
    const hardestMax = await getHardestMax(user.uid);
    const totalScore = await getTotalScore(user.uid);
    const pgCount = await getClearTypeCount(user.uid, "Perfect Game");
    const ugCount = await getClearTypeCount(user.uid, "Ultimate Game");
    const egCount = await getClearTypeCount(user.uid, "Extreme Game");
    const sgCount = await getClearTypeCount(user.uid, "Superb Game");
    const mgCount = await getClearTypeCount(user.uid, "Marvelous Game");
    const tgCount = await getClearTypeCount(user.uid, "Talented Game");
    const fgCount = await getClearTypeCount(user.uid, "Fair Game");
    const rgCount = await getClearTypeCount(user.uid, "Rough Game");
    statsElem.innerHTML = `
            <h2>Statistics</h2>
            <div class="stats-container" style="display: flex; justify-content: space-between;">
            <div class="stats-row">
                <p>Total plays: ${playCount}</p>
                <p>Hardest Difficulty cleared: Lv.${hardestDiff || "???"}</p>
                <p>Hardest Perfect Game: Lv.${hardestPerfectGame || "???"}</p>
                <p>Hardest MAX: Lv.${hardestMax || "???"}</p>
            </div>
            <div class="stats-row">
                <p>Total Score: ${totalScore}</p>
                <div class="clearType">
                 <table style="width: 100%; text-align: center;">
                    <tr>
                        <td style="border: 1px solid white;"><span style="color:#00E3FF;">PG</span><br><span style="font-size: 0.8em;">${pgCount}</span></td>
                        <td style="border: 1px solid white;"><span style="color:#00E3FF;">UG</span><br><span style="font-size: 0.8em;">${ugCount}</span></td>
                        <td style="border: 1px solid white;"><span style="color:#FFC900;">EG</span><br><span style="font-size: 0.8em;">${egCount}</span></td>
                        <td style="border: 1px solid white;"><span style="color:#FFC900;">SG</span><br><span style="font-size: 0.8em;">${sgCount}</span></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid white;"><span style="color:#AFAFAF;">MG</span><br><span style="font-size: 0.8em;">${mgCount}</span></td>
                        <td style="border: 1px solid white;"><span style="color:#AFAFAF;">TG</span><br><span style="font-size: 0.8em;">${tgCount}</span></td>
                        <td style="border: 1px solid white;"><span style="color:#844400;">FG</span><br><span style="font-size: 0.8em;">${fgCount}</span></td>
                        <td style="border: 1px solid white;"><span style="color:#844400;">RG</span><br><span style="font-size: 0.8em;">${rgCount}</span></td>
                    </tr>
                </div>
            </div>
            </div>
        `; //TODO: add Single and Double diffentation
  } catch (error) {
    console.error("Error fetching playcount:", error);
    statsElem.innerHTML = `
            <h2>Statistics</h2>
            <p>Error loading statistics.</p>
        `;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      playerAvatar.src = "img/default-avatar.png";
      playerName.textContent = "Guest";
      pumpbility.innerHTML = "PUMBILITY: 0";
      role.innerHTML = "";
      timecreated.innerHTML = "";
      return;
    }

    // Set avatar and name
    playerAvatar.src = user.photoURL || "img/default-avatar.png";


    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const lastUsernames = userDocSnap.data().lastUsernames;
      if (lastUsernames.length > 0) {
        playerName.innerHTML = user.displayName + `<span style='font-size: 0.4em; color: #aaa;'> Formerly known as: ${lastUsernames.join(", ")}</span>`;
      } else {
        playerName.textContent = user.displayName || "undefined";
      }

      if (!userDocSnap.exists()) {
        pumpbility.innerHTML = "PUMBILITY: 0";
        role.innerHTML = "";
        timecreated.innerHTML = "";
        return;
      }

      // Dynamically import date-fns when needed
      if (!formatDistanceToNow) {
        ({ formatDistanceToNow } = await import(
          "https://unpkg.com/date-fns@3.6.0/formatDistanceToNow.mjs"
        ));
      }

      const userData = userDocSnap.data();
      const timeCreated = userData.timeCreated;
      let timeCreatedFormatted = "";
      if (typeof timeCreated === "number" || typeof timeCreated === "string") {
        timeCreatedFormatted = formatDistanceToNow(timeCreated, {
          addSuffix: true,
        });
        timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
        timecreated.onmouseover = () => {
          timecreated.innerHTML = `Joined at ${new Date(
            timeCreated
          ).toLocaleString("en-GB", { hour12: false })}`;
        };
        timecreated.onmouseout = () => {
          timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
        };
      } else {
        timecreated.innerHTML = "";
      }
      if (userData.role === "banned") {
        // Set the role text and hide profile details if user is banned
        role.innerHTML =
          "<span style='color:rgb(121, 121, 121); font-size: 1.5em;'>Banned.</span> <br> You have been banned from the site. <br> <span style='font-size: 0.8em;'>If you think this is a mistake, please contact an admin.</span>";
        document.querySelector(".bp").innerHTML = "";
        document.querySelector(".rp").innerHTML = "";
        document.querySelector("#settings").style.display = "none";
        document.querySelector("#statistics").style.display = "none";
        document.querySelector("#pbility").style.display = "none";
        document.querySelector(".timecreated").style.display = "none";
        document.querySelector(".avatar img").src = "img/default-avatar.png";
        return;
      }
      if (
        userData.timeBanned &&
        Date.now() - userData.timeBanned < 1000 * 60 * 60 * 24 * 180
      ) {
        // if the user has been banned in the last 180 days
        document.querySelector(".badstanding").style.display = "block";
      }
      // Role
      setRoleText(role, userData.role || "Player");

      // Initial pumpbility display
      const pbValue =
        typeof userData.pumpbility === "number" ? userData.pumpbility : 0;
      pumpbility.innerHTML = `PUMBILITY: ${pbValue}`;
      pumpbility.style.background = "";

      // Get scores from subcollection
      import("./firebase.js").then(async ({ collection, getDocs }) => {
        const scoresSnap = await getDocs(
          collection(db, "users", user.uid, "scores")
        );
        const scores = [];
        scoresSnap.forEach((doc) => {
          scores.push(doc.data());
        });

        // Best Plays: top 30 by pumpbility, unique by song name and level and rate
        const bestPlaysMap = new Map();
        for (const play of scores) {
          if (typeof play.pumpbility !== "number") continue;
          if (play.chartFail === true || play.chartFail === "true") continue;
          if (
            play.rate === "undefined" ||
            play.rate === "undefined" ||
            play.rate === "" ||
            play.rate === null ||
            isNaN(play.rate)
          ) {
            play.rate = 1;
          }
          const key = `${play.sn}__${play.lvl}__${Number(play.rate)}`;
          const existing = bestPlaysMap.get(key);
          if (
            !existing ||
            (play.pumpbility || 0) > (existing.pumpbility || 0) ||
            (play.score === 1000000 &&
              play.isSuperbOn === true &&
              Number(play.fa) + Number(play.sl) <
                (Number(existing?.fa) + Number(existing?.sl) || 0))
          ) {
            bestPlaysMap.set(key, play);
          }
        }
        const bestPlays = Array.from(bestPlaysMap.values())
          .sort((a, b) => (b.pumpbility || 0) - (a.pumpbility || 0))
          .slice(0, 30);
        if (bestPlays.length === 0) {
          const bestPlaysTable = document.querySelector(".bp .play-table");
          if (bestPlaysTable) {
            // Remove all rows except the header
            bestPlaysTable.innerHTML = `
                            <tr>
                                <th style="width: 25%;">Song</th>
                                <th style="width: 10%;">Difficulty</th>
                                <th style="width: 10%;">Score</th>
                                <th style="width: 10%;">Grade</th>
                                <th style="width: 10%;">Clear Type</th>
                                <th style="width: 10%;">Pumpbility</th>
                                <th style="width: 15%;">Time</th>
                            </tr>
                            <tr>
                                <td colspan="7" style="text-align:center; color:#aaa;">No best plays</td>
                            </tr>
                        `;
          }
        }
        const pumpbilitywithoutpending = bestPlays.filter(
          (play) => play.pending !== true
        );
        const pumpbilityTotal = pumpbilitywithoutpending.reduce(
          (acc, play) => acc + (play.pumpbility || 0),
          0
        );
        pumpbility.innerHTML = `PUMBILITY: ${pumpbilityTotal}`;
        const color = getPumpbilityColor(pumpbilityTotal);
        if (color.startsWith("linear-gradient")) {
          pumpbility.style.background = color;
          pumpbility.style.webkitTextFillColor = "transparent";
          pumpbility.style.color = "transparent";
          pumpbility.style.webkitBackgroundClip = "text";
          pumpbility.style.backgroundClip = "text";
        } else {
          pumpbility.style.color = color;
        }
        if (
          userData.role !== "veteran" &&
          userData.role !== "sysop" &&
          userData.role !== "admin" &&
          userData.role !== "moderator" &&
          user.pumpbility > 30000
        ) {
          await updateDoc(userDocRef, { role: "veteran" });
          setRoleText(role, "veteran");
        }
        const score = await getTotalScore(user.uid);
        await updateDoc(userDocRef, {
          pumpbility: pumpbilityTotal,
          score: score,
        });

        // Recent Plays: top 30 by timestamp (descending)
        const recentPlays = scores
          .filter(
            (play) =>
              typeof play.timestamp === "number" &&
              play.timestamp > Date.now() - 1000 * 60 * 60 * 24 * 7
          ) //only show plays from the last 7 days
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 30);

        if (
          recentPlays.length === 0 ||
          recentPlays[0].timestamp < Date.now() - 1000 * 60 * 60 * 24 * 30
        ) {
          const recentPlaysTable = document.querySelector(".rp .play-table");
          // if (recentPlaysTable) {
          //   recentPlaysTable.innerHTML = `
          //                   <tr>
          //                       <td colspan="7" style="text-align:center; color:#aaa;">No recent plays</td>
          //                   </tr>
          //               `;
          // }
        }
        // Find the tables
        const bestPlaysTable = document.querySelector(".bp .play-table");
        const recentPlaysTable = document.querySelector(".rp .play-table");

        // Helper to render table rows
        function renderRows(plays) {
          return plays
            .map((play) => {
              const href = `/score.html?user=${encodeURIComponent(
                user.displayName
              )}&sn=${encodeURIComponent(
                play.sn || ""
              )}&lvl=${encodeURIComponent(
                play.lvl || ""
              )}&t=${encodeURIComponent(play.timestamp || "")}`;
              let scoreCell = "";
              if (play.pending === true) {
                play.score = "Pending";
                play.grade = "Pending";
                play.cleartype = "Pending";
                play.pumpbility = 0;
              }
              // Normalize chartFail
              const chartFail =
                play.chartFail === true || play.chartFail === "true";
              if (chartFail) {
                play.cleartype = "";
                play.pumpbility = 0;
              }

              // Score cell logic
              if (play.score === 1000000) {
                const minusMax = Number(play.fa) + Number(play.sl);
                const isSuperb =
                  play.isSuperbOn === true || play.isSuperbOn === "true";
                const isPerfect =
                  Number(play.gr) +
                    Number(play.gd) +
                    Number(play.bd) +
                    Number(play.ms) ===
                  0;

                if (minusMax === 0 && isSuperb) {
                  scoreCell = `1000000 <span style='color:rgb(174, 255, 248); font-size: 0.6em;'>(MAX)</span>`;
                } else if (isPerfect && isSuperb) {
                  scoreCell = `1000000 <span style='color:rgb(174, 255, 248); font-size: 0.6em;'>(MAX-${minusMax})</span>`;
                } else {
                  scoreCell = `1000000`;
                }
              } else {
                scoreCell = play.score || "";
              }
              if (play.timestamp < Date.now() - 1000 * 60 * 60 * 24 * 30) {
                return `<tr>
                                <td colspan="7" style="text-align:center; color:#aaa;">No recent plays</td>
                            </tr>`;
              }
              return `<tr>
                            <td><a style="text-decoration: none; color: white;" href="${href}">${
                play.sn || ""
              }</a></td>
                            <td>
                                ${play.lvl || ""}
                                <span class="rate" style="font-size: 0.8em; color: ${play.rate < 1 ? "rgb(98, 255, 93)" : "rgb(255, 82, 82)"};">
                                    ${
                                      Number(play.rate) === 1 ||
                                      play.rate === undefined ||
                                      play.rate === "undefined" ||
                                      play.rate === "" ||
                                      play.rate === null
                                        ? ""
                                        : `(${play.rate}x)`
                                    }
                                </span>
                            </td>
                            <td>${scoreCell}</td>
                            <td>${play.grade || ""}</td>
                            <td>${play.cleartype || ""}</td>
                            <td>${
                              typeof play.pumpbility === "number" &&
                              !isNaN(play.pumpbility)
                                ? play.pumpbility
                                : ""
                            }</td>
                            <td>${play.timeString || ""}</td>
                        </tr>`;
            })
            .join("");
        }
        // Render Best Plays
        if (bestPlaysTable) {
          bestPlaysTable.innerHTML = `
                        <tr>
                          <th style="width: 25%;">Song</th>
                          <th style="width: 10%;">Difficulty</th>
                          <th style="width: 10%;">Score</th>
                          <th style="width: 10%;">Grade</th>
                          <th style="width: 10%;">Clear Type</th>
                          <th style="width: 10%;">Pumpbility</th>
                          <th style="width: 15%;">Time</th>
                        </tr>
                        ${renderRows(bestPlays)}
                    `;
        }

        // Render Recent Plays
        if (recentPlaysTable) {
          recentPlaysTable.innerHTML = `
                        <tr>
                          <th style="width: 25%;">Song</th>
                          <th style="width: 10%;">Difficulty</th>
                          <th style="width: 10%; text-align: center;">Score</th>
                          <th style="width: 10%; text-align: center;">Grade</th>
                          <th style="width: 10%;">Clear Type</th>
                          <th style="width: 10%;">Pumpbility</th>
                          <th style="width: 15%;">Time</th>
                        </tr>
                        ${renderRows(recentPlays)}
                    `;
        }
      });
    } catch (e) {
      console.error("Error loading profile:", e);
      pumpbility.innerHTML = "PUMBILITY: 0";
      role.innerHTML = "";
      timecreated.innerHTML = "";
    }
  });
});

  // the scores are now automatically generated on upload, no need for this anymore
  // addtoLB.addEventListener("click", async () => {
  //   const user = getAuth().currentUser;
  //   if (!user) {
  //     return;
  //   }
  //   const overlay = document.querySelector("#addtoLBStatusOverlay");
  //   overlay.style.display = "flex";
  //   overlay.style.background = "rgba(0,0,0,0.8)";
  //   overlay.style.width = "100vw";
  //   overlay.style.height = "100vh";
  //   overlay.style.top = "0";
  //   overlay.style.left = "0";
  //   overlay.style.position = "fixed";
  //   overlay.style.zIndex = "1000";
  //   overlay.style.justifyContent = "center";
  //   overlay.style.alignItems = "center";
  //   overlay.style.fontSize = "2em";
  //   overlay.style.textAlign = "center";
  //   overlay.innerHTML = `
  //     <div style="background: #222; padding: 40px 60px; border-radius: 16px; box-shadow: 0 4px 32px #000a; border: 2px solid #4ad;">
  //       <div style="margin-bottom: 10px; font-weight: bold;">Uploading data...</div>
  //       <div class="addtolb-status-message"></div>
  //       <button id="closeAddtoLBOverlay" style="margin-top: 20px; padding: 8px 24px; border-radius: 8px; border: none; background: #4ad; color: #fff; font-size: 1em; cursor: pointer; display: none;">Close</button>
  //     </div>
  //   `;

  //   const statusMsg = overlay.querySelector(".addtolb-status-message");
  //   const closeBtn = overlay.querySelector("#closeAddtoLBOverlay");

  //   function showCloseButton() {
  //     closeBtn.style.display = "inline-block";
  //     closeBtn.onclick = () => {
  //       overlay.style.display = "none";
  //       overlay.innerHTML = "";
  //     };
  //   }

  //   try {
  //     const userScoresSnapshot = await getDocs(collection(db, "users", user.uid, "scores"));
  //     let addedCount = 0;
  //     let skippedCount = 0;

  //     // Group user scores by songKey+lvl+rate for efficient filtering
  //     const scoresToAdd = [];
  //     // get best score for each songKey+lvl+rate
  //     const bestScores = new Map();
  //     const bestScoresSet = new Set();
  //     for (const docSnap of userScoresSnapshot.docs) {
  //       const scoreData = docSnap.data();
  //       if (!scoreData.sn) {
  //         skippedCount++;
  //         continue; // skip if no song name/id
  //       }
  //       const songKey = scoreData.sn.trim().toLowerCase().replace(/\s+/g, "");
  //       const lvl = scoreData.lvl;
  //       const rate = Number(scoreData.rate);
  //       const uniqueKey = `${songKey}|||${lvl}|||${rate}`;
  //       // Only keep one score per uniqueKey (if duplicates in user collection)
  //       if (!bestScoresSet.has(uniqueKey) || scoreData.score > bestScores.get(uniqueKey).score) {
  //         bestScores.set(uniqueKey, scoreData);
  //         bestScoresSet.add(uniqueKey);
  //         scoresToAdd.push({ scoreData, songKey, lvl, rate, uniqueKey });
  //       }
  //     }

  //     // For each unique (songKey, lvl, rate), check if already exists in leaderboard
  //     // Batch queries by songKey for efficiency
  //     const groupedBySong = {};
  //     for (const entry of scoresToAdd) {
  //       if (!groupedBySong[entry.songKey]) groupedBySong[entry.songKey] = [];
  //       groupedBySong[entry.songKey].push(entry);
  //     }

  //     for (const songKey in groupedBySong) {
  //       const entries = groupedBySong[songKey];
  //       const songScoresRef = collection(db, "songs", songKey, "scores");
  //       // Ensure the song document exists and set its name (merge: true to avoid overwriting)
  //       await setDoc(doc(db, "songs", songKey), {
  //         name: entries[0].scoreData.sn,
  //         // artist: entries[0].scoreData.artist, //adding this later
  //         // series: entries[0].scoreData.series, //adding this later
  //       }, { merge: true });

  //       // Get all leaderboard scores for this user for this song
  //       let leaderboardScores = [];
  //       try {
  //         const q = query(songScoresRef, where("player", "==", user.displayName));
  //         const leaderboardSnapshot = await getDocs(q);
  //         leaderboardScores = leaderboardSnapshot.docs.map(d => d.data());
  //       } catch (err) {
  //         console.error("Error fetching leaderboard entries for song:", songKey, err);
  //         // If we can't check, skip all for this song
  //         skippedCount += entries.length;
  //         continue;
  //       }

  //       // Build a set of existing (lvl, rate) for this user/song
  //       const existingSet = new Set(
  //         leaderboardScores.map(s => `${s.lvl}|||${Number(s.rate)}`)
  //       );

  //       for (const entry of entries) {
  //         const key = `${entry.lvl}|||${entry.rate}`;
  //         if (existingSet.has(key)) {
  //           skippedCount++;
  //           continue;
  //         }
  //         try {
  //           await addDoc(songScoresRef, {
  //             ...entry.scoreData,
  //             player: user.displayName,
  //           });
  //           addedCount++;
  //         } catch (err) {
  //           console.error("Error adding score to leaderboard:", err);
  //           skippedCount++;
  //         }
  //       }
  //     }

  //     statusMsg.innerHTML = `<span style="color:#7fffa7;">${addedCount} score(s) added to leaderboard</span>, <span style="color:#ffb347;">${skippedCount} score(s) skipped</span>.`;
  //     showCloseButton();
  //   } catch (e) {
  //     console.error("Error adding scores to leaderboard:", e);
  //     statusMsg.innerHTML = `<span style="color:#ff6b6b;">Failed to add scores to leaderboard.</span>`;
  //     showCloseButton();
  //   }

