import { getAuth, onAuthStateChanged, getDoc, doc, db, updateDoc } from "./firebase.js";
let formatDistanceToNow;
const playerName = document.querySelector("[playername]");
const playerAvatar = document.querySelector("#playerpfp");
const pumpbility = document.querySelector("#pbility");
const role = document.querySelector(".role");
const timecreated = document.querySelector(".timecreated");

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
    { pumpbility: 28000, color: "linear-gradient(90deg, rgb(255, 87, 87) 0%, rgb(255, 190, 92) 20%, rgba(208, 222, 33, 1) 40%, rgb(171, 255, 138) 60%, rgb(100, 255, 162) 80%, rgba(47, 201, 226, 1) 0%" },
    { pumpbility: 30000, color: "linear-gradient(90deg,rgba(251, 255, 8, 1) 0%, rgba(255, 3, 255, 1) 25%, rgba(0, 38, 255, 1) 50%, rgba(0, 242, 255, 1) 75%, rgba(0, 255, 170, 1) 100%)" },
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
        case "user":
        default:
            roleElem.innerHTML = "";
            break;
    }
}

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

                // Best Plays: top 30 by pumpbility, unique by song name and level
                const bestPlaysMap = new Map();
                for (const play of scores) {
                    if (typeof play.pumpbility !== "number") continue;
                    if (play.chartFail === true || play.chartFail === "true") continue;
                    const key = `${play.sn}__${play.lvl}`;
                    const existing = bestPlaysMap.get(key);
                    if (
                        !existing ||
                        (play.pumpbility || 0) > (existing.pumpbility || 0) ||
                        (
                            play.score === 1000000 &&
                            (Number(play.fa) + Number(play.sl) < (Number(existing?.fa) + Number(existing?.sl) || 0))
                        )
                    ) {
                        bestPlaysMap.set(key, play);
                    }
                }
                const bestPlays = Array.from(bestPlaysMap.values())
                    .sort((a, b) => (b.pumpbility || 0) - (a.pumpbility || 0))
                    .slice(0, 30);

                const pumpbilityTotal = bestPlays.reduce((acc, play) => acc + (play.pumpbility || 0), 0);
                pumpbility.innerHTML = `PUMBILITY: ${pumpbilityTotal}`;

                // Set pumpbility color and veteran role if not staff
                if (!["sysop", "admin", "moderator"].includes(userData.role)) {
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
                } else {
                    pumpbility.style.background = "";
                    pumpbility.style.backgroundColor = "";
                    pumpbility.style.webkitTextFillColor = "";
                }

                await updateDoc(userDocRef, { pumpbility: pumpbilityTotal});

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
                    return plays.map(play => {
                        const href = `/score.html?user=${user.displayName}&sn=${encodeURIComponent(play.sn || "")}&lvl=${encodeURIComponent(play.lvl || "")}&t=${encodeURIComponent(play.timestamp || "")}`;
                        let scoreCell = "";
                        if (play.chartFail === true || play.chartFail === "true") {
                            play.cleartype = "";
                            play.pumpbility = 0;
                        }
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
                        } else {
                            scoreCell = play.score || "";
                        }
                        return `<tr>
                            <td><a style="text-decoration: none; color: white;" href="${href}">${play.sn || ""}</a></td>
                            <td>${play.lvl || ""}</td>
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