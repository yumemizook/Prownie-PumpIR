import {
  db,
  collection,
  getDocs,
} from "./firebase.js";

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
  { pumpbility: 30000, color: "linear-gradient(90deg, rgb(255, 87, 87) 0%, rgb(255, 190, 92) 20%, rgba(208, 222, 33, 1) 40%, rgb(171, 255, 138) 60%, rgb(100, 255, 162) 80%, rgba(47, 201, 226, 1) 100%" },
  { pumpbility: 35000, color: "linear-gradient(90deg,rgba(251, 255, 8, 1) 0%, rgba(255, 3, 255, 1) 25%, rgba(0, 38, 255, 1) 50%, rgba(0, 242, 255, 1) 75%, rgba(0, 255, 170, 1) 100%)" },
];

function getPumpbilityColor(value) {
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

let formatDistanceToNow;
const playerName = document.querySelector("[playername]");
const playerAvatar = document.querySelector("#playerpfp");
const pumpbility = document.querySelector("#pbility");
const role = document.querySelector(".role");
const timecreated = document.querySelector(".timecreated");
const reportButton = document.querySelector("#report-user");

  
document.addEventListener("DOMContentLoaded", async () => {
  const playerNameParam = new URLSearchParams(window.location.search).get(
    "name"
  );
  document.querySelector("title").innerHTML = `${playerNameParam}'s Profile`;

  // Query the users collection for a user with the given username
  const usersRef = collection(db, "users");
  let foundUser = null;
  let foundUserDocId = null;
  const querySnapshot = await getDocs(usersRef);
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    if (
      typeof data.username === "string" &&
      typeof playerNameParam === "string" &&
      data.username.toLowerCase() === playerNameParam.toLowerCase()
    ) {
      foundUser = data;
      foundUserDocId = docSnap.id;
      break;
    }
  }
  if (!foundUser) {
    document.querySelector(".profilecontainer").innerHTML =
      "User not found! <br> You might have mistyped something, or the user might not exist. <h4><a href='./index.html'>Go back to the home page?</a></h4>";
    document.querySelector(".profilecontainer").style.textAlign = "center";
    document.querySelector(".profilecontainer").style.marginTop = "100px";
    document.querySelector(".profilecontainer").style.fontSize = "1.5em";
    document.querySelector(".profilecontainer a").style.color = "white";
    return;
  }

  playerName.innerHTML = foundUser.username;
  playerAvatar.src = foundUser.profilePicture;
  pumpbility.innerHTML = `PUMBILITY: ${foundUser.pumpbility}`;
  if (!formatDistanceToNow) {
    ({ formatDistanceToNow } = await import("https://unpkg.com/date-fns@3.6.0/formatDistanceToNow.mjs"));
}

reportButton.addEventListener("click", (e) => {
  e.preventDefault();
  const url = new URL("userreport.html", window.location.origin);
  url.searchParams.set("name", foundUser.username);
  url.searchParams.set("id", foundUser.id || foundUser.uid || foundUser.userId || foundUser.docId || foundUserDocId || "");
  window.location.href = url.toString();
});

const timeCreated = foundUser.timeCreated;
const timeCreatedFormatted = formatDistanceToNow(timeCreated, { addSuffix: true });
timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
timecreated.addEventListener("mouseover", () => {
    timecreated.innerHTML = `Joined at ${new Date(timeCreated).toLocaleString('en-GB', { hour12: false })}`;
});
timecreated.addEventListener("mouseout", () => {
    timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
});
if (foundUser.role === "banned") {
  // Set the role text and hide profile details for banned users
  role.innerHTML = "<span style='color:rgb(121, 121, 121); font-size: 1.5em;'>Banned.</span> <br> This account has been banned from the site.";
  document.querySelector(".plays").innerHTML = "";
  document.querySelector(".plays").style.alignItems = "center";
  document.querySelector(".plays").style.display = "flex";
  document.querySelector(".plays").style.flexDirection = "column";
  document.querySelector(".plays").style.justifyContent = "center";
  document.querySelector(".plays").style.marginTop = "100px";
  document.querySelector(".plays").style.fontSize = "1.5em";
  document.querySelector(".plays").style.color = "rgb(121, 121, 121)";
  document.querySelector("#add-rival").style.display = "none";
  document.querySelector("#report-user").style.display = "none";
  document.querySelector("#pbility").style.display = "none";
  document.querySelector(".timecreated").style.display = "none";
  document.querySelector(".avatar img").src = "img/default-avatar.png";
  return;
}
if (foundUser.timeBanned && (Date.now() - foundUser.timeBanned < 1000 * 60 * 60 * 24 * 180)) { // if the user has been banned in the last 180 days
  document.querySelector(".badstanding").style.display = "block";
}
  const userRole = foundUser.role || "Player";
  switch (userRole) {
    case "owner":
      role.innerHTML =
        "<span style='color:rgb(255, 125, 125);'>----- The sole creator of this website -----</span>";
      break;
    case "sysop":
      role.innerHTML =
        "<span style='color:rgb(82, 212, 255);'>---- The twin of Don ----</span>";
      break;
    case "admin":
      role.innerHTML =
        "<span style='color:rgb(215, 255, 82);'>--- Admin ---</span>";
      break;
    case "moderator":
      role.innerHTML =
        "<span style='color:rgb(146, 82, 255);'>-- Leaderboard Moderator --</span>";
      break;
    case "veteran":
      role.innerHTML =
        "<span style='color:rgb(255, 146, 82);'>- Leg of God -</span>";
      break;
    case "user":
    default:
      role.innerHTML = "";
      break;
  }
  //now to load the scores
  try {
    let userUid = null;
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.username &&
        data.username.toLowerCase() === foundUser.username.toLowerCase()
      ) {
        userUid = docSnap.id;
      }
    });

    if (!userUid) {
      pumpbility.innerHTML = "PUMBILITY: 0";
      return;
    }
    const scoresSnap = await getDocs(collection(db, "users", userUid, "scores"));
    const scores = [];
    scoresSnap.forEach(doc => {
      scores.push(doc.data());
    });

    // Best Plays: top 30 by pumpbility, unique by song name and level
    const bestPlaysMap = new Map();
    scores
      .filter(play => typeof play.pumpbility === "number")
      .forEach(play => {
        if (play.chartFail === true || play.chartFail === "true") return;
        // Normalize rate
        if (
          play.rate === undefined ||
          play.rate === null ||
          play.rate === "" ||
          play.rate === "undefined" ||
          isNaN(Number(play.rate))
        ) {
          play.rate = 1;
        }
        const key = `${play.sn}__${play.lvl}__${play.rate}`;
        const existing = bestPlaysMap.get(key);
        // Always prefer the play with the highest pumpbility for this song/level
        if (
          !existing ||
          (play.pumpbility || 0) > (existing.pumpbility || 0) ||
          (
            play.score === 1000000 &&
            (play.isSuperbOn === true || play.isSuperbOn === "true") &&
            (Number(play.fa) + Number(play.sl) < (Number(existing?.fa) + Number(existing?.sl) || 0))
          )
        ) {
          bestPlaysMap.set(key, play);
        }
      });
    const bestPlays = Array.from(bestPlaysMap.values())
      .sort((a, b) => (b.pumpbility || 0) - (a.pumpbility || 0))
      .slice(0, 30);

    if (bestPlays.length === 0) {
      const bestPlaysTable = document.querySelector(".bp .play-table");
      if (bestPlaysTable) {
        bestPlaysTable.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; color:#aaa;">No best plays</td>
          </tr>
        `;
      }
    }
    const pumpbilityTotal = bestPlays.reduce((acc, play) => acc + (play.pumpbility || 0), 0);
    pumpbility.innerHTML = `PUMBILITY: ${pumpbilityTotal}`;

    const color = getPumpbilityColor(pumpbilityTotal);
    if (color.startsWith("linear-gradient")) {
      pumpbility.style.color = "transparent";
      pumpbility.style.background = color;
      pumpbility.style.webkitTextFillColor = "transparent";
      pumpbility.style.webkitBackgroundClip = "text";
      pumpbility.style.backgroundClip = "text";
    } else {
      pumpbility.style.color = color;
    }

    // Recent Plays: top 30 by timestamp (descending)
    const recentPlays = scores
      .filter(play => typeof play.timestamp === "number" && play.timestamp > Date.now() - 1000 * 60 * 60 * 24 * 7) //only show plays from the last 7 days
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 30);

    if (recentPlays.length === 0 || recentPlays[0].timestamp < Date.now() - 1000 * 60 * 60 * 24 * 30) {
      const recentPlaysTable = document.querySelector(".rp .play-table");
      if (recentPlaysTable) {
        recentPlaysTable.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; color:#aaa;">No recent plays</td>
          </tr>
        `;
      }
    }
    // Find the tables
    const bestPlaysTable = document.querySelector(".bp .play-table");
    const recentPlaysTable = document.querySelector(".rp .play-table");

    // Helper to render table rows
    function renderRows(plays) {
      return plays.map(play => {
        let scoreCell = play.score || "";
        // If chart failed, clear cleartype and set pumpbility to 0
        if (play.chartFail === true || play.chartFail === "true") {
          play.cleartype = "";
          play.pumpbility = 0;
        }
        // Special formatting for perfect scores
        if (play.score === 1000000) {
          const minusMax = Number(play.fa) + Number(play.sl);
          if (minusMax === 0) {
            scoreCell = `1000000 <span style='color:rgb(174, 255, 248); font-size: 0.6em;'>(MAX)</span>`;
          } else if (
            Number(play.gr) + Number(play.gd) + Number(play.bd) + Number(play.ms) === 0
          ) {
            scoreCell = `1000000 <span style='color:rgb(174, 255, 248); font-size: 0.6em;'>(MAX-${minusMax})</span>`;
          } else {
            scoreCell = `1000000`;
          }
        }
        return `<tr>
            <td><a style="text-decoration: none; color: white;" href="/score.html?user=${foundUser.username}&sn=${encodeURIComponent(play.sn || "")}&lvl=${encodeURIComponent(play.lvl || "")}&t=${encodeURIComponent(play.timestamp || "")}">${play.sn || ""}</a></td>
            <td>${play.lvl || ""} <span style="font-size: 0.8em; color: #f22;">
                ${
                    Number(play.rate) === 1 ||
                    play.rate === undefined ||
                    play.rate === "undefined" ||
                    play.rate === "" ||
                    play.rate === null
                        ? ""
                        : `(${play.rate}x)`
                }
            </span></td>
            <td>${scoreCell}</td>
            <td>${play.grade || ""}</td>
            <td>${play.cleartype || ""}</td>
            <td>${play.pumpbility ?? ""}</td>
            <td>${play.timeString || ""}</td>
        </tr>`;
      }).join("");
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
          <th style="width: 10%;">Score</th>
          <th style="width: 10%;">Grade</th>
          <th style="width: 10%;">Clear Type</th>
          <th style="width: 10%;">Pumpbility</th>
          <th style="width: 15%;">Time</th>
        </tr>
        ${renderRows(recentPlays)}
      `;
    }
  } catch (e) {
    console.error("Error loading user scores:", e);
    pumpbility.innerHTML = "PUMBILITY: 0";
  }
});