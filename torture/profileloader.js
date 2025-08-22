import { getAuth, onAuthStateChanged, getDoc, doc, db, updateDoc, collection, query, where, getDocs, getCountFromServer } from "./firebase.js";
let formatDistanceToNow;
const playerName = document.querySelector("[playername]");
const playerAvatar = document.querySelector("#playerpfp");
const pumpbility = document.querySelector("#pbility");
const role = document.querySelector(".role");
const timecreated = document.querySelector(".timecreated");
const stats = document.querySelector(".stats");
const statsbutton = document.querySelector("#statistics");

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
            roleElem.innerHTML = "<span style='color:rgb(255, 125, 125);'>----- The sole creator of this website -----</span>";
            break;
        case "sysop":
            roleElem.innerHTML = "<span style='color:rgb(82, 212, 255);'>---- The twin of Don ----</span>";
            break;
        case "admin":
            roleElem.innerHTML = "<span style='color:rgb(215, 255, 82);'>--- Admin ---</span>";
            break;
        case "moderator":
            roleElem.innerHTML = "<span style='color:rgb(146, 82, 255);'>-- Leaderboard Moderator --</span>";
            break;
        case "veteran":
            roleElem.innerHTML = "<span style='color:rgb(255, 146, 82);'>- Leg of God -</span>";
            break;
        case "banned":
            roleElem.innerHTML = "<span style='color:rgb(121, 121, 121);'>Banned.</span> <br> This account has been banned from the site.";
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
        scoresSnapshot.forEach(doc => {
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
        scoresSnapshot.forEach(doc => {
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
        scoresSnapshot.forEach(doc => {
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
    scoresSnapshot.forEach(doc => {
        const scoreData = doc.data();
        totalScore += Number(scoreData.score) || 0;
    });
    return totalScore;
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
        playerName.textContent = user.displayName || "undefined";

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                pumpbility.innerHTML = "PUMBILITY: 0";
                role.innerHTML = "";
                timecreated.innerHTML = "";
                return;
            }

            // Dynamically import date-fns when needed
            if (!formatDistanceToNow) {
                ({ formatDistanceToNow } = await import("https://unpkg.com/date-fns@3.6.0/formatDistanceToNow.mjs"));
            }

            const userData = userDocSnap.data();
            const timeCreated = userData.timeCreated;
            let timeCreatedFormatted = "";
            if (typeof timeCreated === "number" || typeof timeCreated === "string") {
                timeCreatedFormatted = formatDistanceToNow(timeCreated, { addSuffix: true });
                timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
                timecreated.onmouseover = () => {
                    timecreated.innerHTML = `Joined at ${new Date(timeCreated).toLocaleString('en-GB', { hour12: false })}`;
                };
                timecreated.onmouseout = () => {
                    timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
                };
            } else {
                timecreated.innerHTML = "";
            }
            if (userData.role === "banned") {
                // Set the role text and hide profile details if user is banned
                role.innerHTML = "<span style='color:rgb(121, 121, 121); font-size: 1.5em;'>Banned.</span> <br> You have been banned from the site. <br> <span style='font-size: 0.8em;'>If you think this is a mistake, please contact an admin.</span>";
                document.querySelector(".bp").innerHTML = "";
                document.querySelector(".rp").innerHTML = "";
                document.querySelector("#settings").style.display = "none";
                document.querySelector("#statistics").style.display = "none";
                document.querySelector("#pbility").style.display = "none";
                document.querySelector(".timecreated").style.display = "none";
                document.querySelector(".avatar img").src = "img/default-avatar.png";
                return;
              }
            // Role
            setRoleText(role, userData.role || "Player");

            // Initial pumpbility display
            const pbValue = typeof userData.pumpbility === "number" ? userData.pumpbility : 0;
            pumpbility.innerHTML = `PUMBILITY: ${pbValue}`;
            pumpbility.style.background = "";

            // Get scores from subcollection
            import("./firebase.js").then(async ({ collection, getDocs }) => {
                const scoresSnap = await getDocs(collection(db, "users", user.uid, "scores"));
                const scores = [];
                scoresSnap.forEach(doc => {
                    scores.push(doc.data());
                });

                // Best Plays: top 30 by pumpbility, unique by song name and level and rate
                const bestPlaysMap = new Map();
                for (const play of scores) {
                    if (typeof play.pumpbility !== "number") continue;
                    if (play.chartFail === true || play.chartFail === "true") continue;
                    if (play.rate === "undefined" || play.rate === "undefined" || play.rate === "" || play.rate === null || isNaN(play.rate)) {
                        play.rate = 1;
                    }
                    const key = `${play.sn}__${play.lvl}__${Number(play.rate)}`;
                    const existing = bestPlaysMap.get(key);
                    if (
                        !existing ||
                        (play.pumpbility || 0) > (existing.pumpbility || 0) ||
                        (
                            play.score === 1000000 && play.isSuperbOn === true &&
                            (Number(play.fa) + Number(play.sl) < (Number(existing?.fa) + Number(existing?.sl) || 0))
                        )
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
                                <th>Song</th>
                                <th>Difficulty</th>
                                <th>Score</th>
                                <th>Grade</th>
                                <th>Clear Type</th>
                                <th>Pumpbility</th>
                                <th>Time</th>
                            </tr>
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
                        pumpbility.style.background = color;
                        pumpbility.style.webkitTextFillColor = "transparent";
                        pumpbility.style.color = "transparent";
                        pumpbility.style.webkitBackgroundClip = "text";
                        pumpbility.style.backgroundClip = "text";
                    } else {
                        pumpbility.style.color = color;
                    }
                    if (userData.role !== "veteran" && userData.role !== "sysop" && userData.role !== "admin" && userData.role !== "moderator" && user.pumpbility > 30000) {
                        await updateDoc(userDocRef, { role: "veteran" });
                        setRoleText(role, "veteran");
                    }
                const score = await getTotalScore(user.uid);
                await updateDoc(userDocRef, { pumpbility: pumpbilityTotal, score: score });

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
                        const href = `/score.html?user=${encodeURIComponent(user.displayName)}&sn=${encodeURIComponent(play.sn || "")}&lvl=${encodeURIComponent(play.lvl || "")}&t=${encodeURIComponent(play.timestamp || "")}`;
                        let scoreCell = "";

                        // Normalize chartFail
                        const chartFail = play.chartFail === true || play.chartFail === "true";
                        if (chartFail) {
                            play.cleartype = "";
                            play.pumpbility = 0;
                        }

                        // Score cell logic
                        if (play.score === 1000000) {
                            const minusMax = Number(play.fa) + Number(play.sl);
                            const isSuperb = play.isSuperbOn === true || play.isSuperbOn === "true";
                            const isPerfect = Number(play.gr) + Number(play.gd) + Number(play.bd) + Number(play.ms) === 0;

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
                            <td><a style="text-decoration: none; color: white;" href="${href}">${play.sn || ""}</a></td>
                            <td>
                                ${play.lvl || ""}
                                <span style="font-size: 0.8em; color: #f22;">
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
                            <td>${typeof play.pumpbility === "number" && !isNaN(play.pumpbility) ? play.pumpbility : ""}</td>
                            <td>${play.timeString || ""}</td>
                        </tr>`;
                    }).join("");
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
            });
        } catch (e) {
            console.error("Error loading profile:", e);
            pumpbility.innerHTML = "PUMBILITY: 0";
            role.innerHTML = "";
            timecreated.innerHTML = "";
        }
    });
});