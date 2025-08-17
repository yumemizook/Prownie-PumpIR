import { getAuth, onAuthStateChanged, getDoc, doc, db, updateDoc } from "./firebase.js";
let formatDistanceToNow;
const playerName = document.querySelector("[playername]");
const playerAvatar = document.querySelector("#playerpfp");
const pumpbility = document.querySelector("#pbility");
const role = document.querySelector(".role");
const timecreated = document.querySelector(".timecreated");
document.addEventListener("DOMContentLoaded", () => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Set avatar and name
            const avatarImage = user.photoURL || "img/default-avatar.png";
            const username = user.displayName || "undefined";
            playerAvatar.src = avatarImage;
            playerName.textContent = username;
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // Dynamically import date-fns when needed
                    if (!formatDistanceToNow) {
                        ({ formatDistanceToNow } = await import("https://unpkg.com/date-fns@3.6.0/formatDistanceToNow.mjs"));
                    }
                    const timeCreated = userDocSnap.data().timeCreated;
                    const timeCreatedFormatted = formatDistanceToNow(timeCreated, { addSuffix: true });
                    timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
                    timecreated.addEventListener("mouseover", () => {
                        timecreated.innerHTML = `Joined at ${new Date(timeCreated).toLocaleString('en-GB', { hour12: false })}`;
                    });
                    timecreated.addEventListener("mouseout", () => {
                        timecreated.innerHTML = `Joined ${timeCreatedFormatted}`;
                    });
                    // Pumpbility
                    const userData = userDocSnap.data();
                    const userRole = userData.role || "Player";
                    switch (userRole) {
                        case "owner":
                            role.innerHTML = "<span style='color:rgb(255, 125, 125);'>----- The sole creator of this website -----</span>";
                            break;
                        case "sysop":
                            role.innerHTML = "<span style='color:rgb(82, 212, 255);'>---- The twin of Don ----</span>";
                            break;
                        case "admin":
                            role.innerHTML = "<span style='color:rgb(215, 255, 82);'>--- Admin ---</span>";
                            break;
                        case "moderator":
                            role.innerHTML = "<span style='color:rgb(146, 82, 255);'>-- Leaderboard Moderator --</span>";
                            break;
                        case "veteran":
                            role.innerHTML = "<span style='color:rgb(255, 146, 82);'>- Leg of God -</span>";
                        case "user":
                        default:
                            role.innerHTML = "";
                            break;
                    }
                    const pbValue = typeof userData.pumpbility === "number" ? userData.pumpbility : 0;
                    pumpbility.innerHTML = `PUMBILITY: ${pbValue}`;

                    // Get scores from subcollection
                    import("./firebase.js").then(async ({ collection, getDocs }) => {
                        const scoresSnap = await getDocs(collection(db, "users", user.uid, "scores"));
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
                        await updateDoc(userDocRef, {
                            pumpbility: pumpbilityTotal
                        });
                        if (pumpbilityTotal > 30000 && userData.role !== "sysop" && userData.role !== "admin" && userData.role !== "moderator") {
                            await updateDoc(userDocRef, {
                                role: "veteran"
                            });
                        }

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
                                // Clean up: remove trailing space in href param
                                const href = `/score.html?sn=${encodeURIComponent(play.sn || "")}&lvl=${encodeURIComponent(play.lvl || "")}&t=${encodeURIComponent(play.timestamp || "")}`;
                                // Score display logic
                                let scoreCell = "";
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
                } else {
                    pumpbility.innerHTML = "PUMBILITY: 0";
                }
            } catch (e) {
                console.error("Error loading profile:", e);
                pumpbility.innerHTML = "PUMBILITY: 0";
            }
        } else {
            playerAvatar.src = "img/default-avatar.png";
            playerName.textContent = "Guest";
            pumpbility.innerHTML = "PUMBILITY: 0";
        }
    });
});