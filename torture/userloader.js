import {
  getAuth,
  onAuthStateChanged,
  getDoc,
  doc,
  db,
  updateDoc,
  collection,
  getDocs,
} from "./firebase.js";
let formatDistanceToNow;
const playerName = document.querySelector("[playername]");
const playerAvatar = document.querySelector("#playerpfp");
const pumpbility = document.querySelector("#pbility");
const role = document.querySelector(".role");
const timecreated = document.querySelector(".timecreated");
document.addEventListener("DOMContentLoaded", async () => {
  const playerNameParam = new URLSearchParams(window.location.search).get(
    "name"
  );

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
const timeCreated = foundUser.timeCreated;
const timeCreatedFormatted = formatDistanceToNow(timeCreated, { addSuffix: true });
timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
timecreated.addEventListener("mouseover", () => {
    timecreated.innerHTML = `Joined at ${new Date(timeCreated).toLocaleString('en-GB', { hour12: false })}`;
});
timecreated.addEventListener("mouseout", () => {
    timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
});
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
        const key = `${play.sn}__${play.lvl}`;
        // Always prefer the play with the highest pumpbility for this song/level
        if (
          !bestPlaysMap.has(key) ||
          (play.pumpbility || 0) > (bestPlaysMap.get(key).pumpbility || 0) ||
          (
            play.score === 1000000 && //if the player got a PG, prefer the play closest to the max
            (Number(play.fa) + Number(play.sl) < (Number(bestPlaysMap.get(key).fa) + Number(bestPlaysMap.get(key).sl) || 0))
          )
        ) {
          bestPlaysMap.set(key, play);
        }
      });
    const bestPlays = Array.from(bestPlaysMap.values())
      .sort((a, b) => (b.pumpbility || 0) - (a.pumpbility || 0))
      .slice(0, 30);

    const pumpbilityTotal = bestPlays.reduce((acc, play) => acc + (play.pumpbility || 0), 0);
    pumpbility.innerHTML = `PUMBILITY: ${pumpbilityTotal}`;

    // Recent Plays: top 30 by timestamp (descending)
    const recentPlays = scores
      .filter(play => typeof play.timestamp === "number")
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 30);

    // Find the tables
    const bestPlaysTable = document.querySelector(".bp .play-table");
    const recentPlaysTable = document.querySelector(".rp .play-table");

    // Helper to render table rows
    function renderRows(plays) {
      return plays.map(play =>
        `<tr>
            <td><a style="text-decoration: none; color: white;" href="/score.html?sn=${play.sn}&lvl=${play.lvl}&t=${play.timestamp} ">${play.sn || ""}</a></td>
            <td>${play.lvl || ""}</td>
            <td>${play.score === 1000000 ? `1000000 <span style="color:rgb(174, 255, 248); font-size: 0.6em;">(MAX-${Number(play.fa) + Number(play.sl)})</span>` : play.score || ""}</td>
            <td>${play.grade || ""}</td>
            <td>${play.cleartype || ""}</td>
            <td>${play.pumpbility || ""}</td>
            <td>${play.timeString || ""}</td>
        </tr>`
      ).join("");
    }
    // Render Best Plays
    if (bestPlaysTable) {
      bestPlaysTable.innerHTML = `
        <tr>
          <th>Song</th>
          <th>Difficulty</th>
          <th>Score</th>
          <th>Grade</th>
          <th>Clear Type</th>
          <th>Pumpbility</th>
          <th>Time</th>
        </tr>
        ${renderRows(bestPlays)}
      `;
    }

    // Render Recent Plays
    if (recentPlaysTable) {
      recentPlaysTable.innerHTML = `
        <tr>
          <th>Song</th>
          <th>Difficulty</th>
          <th>Score</th>
          <th>Grade</th>
          <th>Clear Type</th>
          <th>Pumpbility</th>
          <th>Time</th>
        </tr>
        ${renderRows(recentPlays)}
      `;
    }
  } catch (e) {
    console.error("Error loading user scores:", e);
    pumpbility.innerHTML = "PUMBILITY: 0";
  }
});