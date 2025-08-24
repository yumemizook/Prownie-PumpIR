import { collection, getDocs, doc, getDoc, db } from "./firebase.js";

const nameElem = document.querySelector(".songinfo h1");
// const artistElem = document.querySelector(".songinfo h4");
// const seriesElem = document.querySelector(".songinfo h5");

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id || typeof id !== "string" || id.trim() === "") {
            console.warn("No valid song ID provided");
            return;
        }

        document.title = id + " - Leaderboard";
        // Load song info
        const songRef = doc(db, "songs", id);
        const songDoc = await getDoc(songRef);
        if (songDoc.exists()) {
            const songData = songDoc.data();
            if (nameElem) nameElem.textContent = songData.name || id;
            // if (artistElem) artistElem.textContent = songData.artist || "";
            // if (seriesElem) artistElem.textContent = songData.series || "";
        }

        // Load scores
        const scoreRef = collection(db, "songs", id, "scores");
        const scoreSnapshot = await getDocs(scoreRef);
        let scores = scoreSnapshot.docs.map((doc) => doc.data());

        // Filter by chartFail if checkbox is unchecked
        // const chartFailButton = document.querySelector("#chartFail");
        // let showFailedScores = true;

        // chartFailButton.addEventListener("click", () => {
        //     showFailedScores = !showFailedScores;
        //     if (showFailedScores) {
        //         chartFailButton.textContent = "Hide failed scores";
        //         const newparams = new URLSearchParams(window.location.search);
        //         newparams.set("hideChartFail", "1");
        //         window.location.href = `${window.location.pathname}?${newparams.toString()}`;
        //     } else {
        //         chartFailButton.textContent = "Show failed scores";
        //         const newparams = new URLSearchParams(window.location.search);
        //         newparams.delete("hideChartFail");
        //         window.location.href = `${window.location.pathname}?${newparams.toString()}`;
        //     }
        // });
        
        // Populate chart difficulty options
        const chartSelect = document.querySelector("#chart");
        if (chartSelect) {
            const uniqueDifficulties = [...new Set(scores.map(score => score.lvl).filter(Boolean))];
            uniqueDifficulties.sort((a, b) => {
                // Extract numeric part for sorting
                const aNum = parseInt(a.toString().match(/\d+/)?.[0] || "0");
                const bNum = parseInt(b.toString().match(/\d+/)?.[0] || "0");
                return aNum - bNum;
            });
            
            // Clear existing options except "All charts"
            chartSelect.innerHTML = '<option value="all">All charts</option>';
            
            // Add difficulty options
            uniqueDifficulties.forEach(difficulty => {
                const option = document.createElement("option");
                option.value = difficulty;
                option.textContent = difficulty;
                chartSelect.appendChild(option);
            });
        }
        
        // Populate rate options
        const rateSelect = document.querySelector("#rate");
        if (rateSelect) {
            // Format rates first, then get unique values
            const formattedRates = scores.map(score => {
                let rate = score.rate;
                if (typeof rate === "number") {
                    if (rate < 1) {
                        rate = rate.toFixed(2);
                    } else {
                        rate = rate.toFixed(1);
                    }
                } else if (rate) {
                    rate = String(rate);
                } else {
                    rate = "1.0";
                }
                return rate;
            });
            
            const uniqueRates = [...new Set(formattedRates)];
            uniqueRates.sort((a, b) => Number(a) - Number(b));
            
            // Clear existing options except "All rates"
            rateSelect.innerHTML = '<option value="all">All rates</option>';
            
            // Add rate options
            uniqueRates.forEach(rate => {
                const option = document.createElement("option");
                option.value = rate;
                option.textContent = rate;
                rateSelect.appendChild(option);
            });
        }
        // Sort by pumpbility descending, then by score descending, then by timestamp ascending
        scores.sort((a, b) => {
            if ((b.pumpbility || 0) !== (a.pumpbility || 0)) {
                return (b.pumpbility || 0) - (a.pumpbility || 0);
            }
            if ((b.score || 0) !== (a.score || 0)) {
                return (b.score || 0) - (a.score || 0);
            }
            return (a.timestamp || 0) - (b.timestamp || 0);
        });

        // // Remove duplicate users (keep best score per user)
        // // Improved duplicate user checking: prefer 'user' or 'displayName' for user identity, fallback to 'name' only if no user field
        // const seenUsers = new Set();
        // scores = scores.filter(score => {
        //     // Prefer user/displayName for user identity, fallback to name if no user field
        //     let user =
        //         (score.user || score.displayName || "").toString().trim().toLowerCase();
        //     if (!user) {
        //         // Only fallback to name if no user/displayName field
        //         user = (score.name || "").toString().trim().toLowerCase();
        //     }
        //     if (!user) return false;
        //     if (seenUsers.has(user)) return false;
        //     seenUsers.add(user);
        //     return true;
        // });
        // Format rate for display
        scores.forEach((score) => {
            if (typeof score.rate === "number") {
                if (score.rate < 1) {
                    score.rate = score.rate.toFixed(2);
                } else {
                    score.rate = score.rate.toFixed(1);
                }
            } else if (score.rate) {
                score.rate = String(score.rate);
            } else {
                score.rate = "1.0";
            }
            if (score.chartFail === "true" || score.cleartype === "" || score.chartFail === true) {
                score.pumpbility = 0;

            }
        });

        let allUsers = [];
        try {
            const userCol = collection(db, "users");
            const userSnapshot = await getDocs(userCol);
            allUsers = userSnapshot.docs.map((doc) => {
                const user = doc.data();
                user.id = doc.id;
                user.profilePicture = user.profilePicture || "img/default-avatar.png";
                return user;
            });
        } catch (error) {
            console.warn("Could not fetch user profiles:", error);
        }

        function getProfilePictureForScore(score) {
            let userKey = (
                score.player ||
                score.displayName ||
                score.user ||
                score.name ||
                ""
            ).toString().trim().toLowerCase();
            if (!userKey) return "img/default-avatar.png";
            
            const matchedUser = allUsers.find(u => {
                const uPlayer = (u.player || "").toString().trim().toLowerCase();
                const uDisplayName = (u.displayName || "").toString().trim().toLowerCase();
                const uUser = (u.user || "").toString().trim().toLowerCase();
                const uName = (u.name || "").toString().trim().toLowerCase();
                
                return (
                    uPlayer === userKey ||
                    uDisplayName === userKey ||
                    uUser === userKey ||
                    uName === userKey
                );
            });
            
            if (matchedUser && typeof matchedUser.profilePicture === "string" && matchedUser.profilePicture.trim() !== "") {
                return matchedUser.profilePicture;
            }
            return "img/default-avatar.png";
        }


        // Render leaderboard
        const leaderboardTable = document.querySelector(".leaderboard");
        if (!leaderboardTable) {
            console.error("Leaderboard table not found");
            return;
        }

        while (leaderboardTable.rows.length > 1) {
            leaderboardTable.deleteRow(1);
        }

        if (scores.length === 0) {
            const row = leaderboardTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 9;
            cell.style.textAlign = "center";
            cell.style.color = "#aaa";
            cell.textContent = "No scores yet";
            return;
        }

        scores.forEach((score, idx) => {
            const tr = document.createElement("tr");
            leaderboardTable.appendChild(tr);
            if (score.pending) {
                return;
            }
            const playerName = score.player || score.displayName || score.user || score.name || "Unknown";
            
            const profilePic = getProfilePictureForScore(score);
            
            tr.innerHTML = `
                <td style="text-align: center; padding: 12px;">${idx + 1}</td>
                <td style="text-align: left; padding: 12px;">
                    <img src="${profilePic}" alt="Profile Picture" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 8px;">
                    <a style="color: inherit; text-decoration: none;" href="./score.html?user=${encodeURIComponent(
                        playerName
                    )}&sn=${encodeURIComponent(
                        score.sn || ""
                    )}&lvl=${encodeURIComponent(
                        score.lvl || ""
                    )}&t=${encodeURIComponent(score.timestamp || "")}">${playerName}</a>
                </td>
                <td style="text-align: center; padding: 12px;">${score.lvl || ""}</td>
                <td style="text-align: center; padding: 12px;" class="rate-cell">${score.rate || ""}</td>
                <td style="text-align: center; padding: 12px;">${score.score || ""}</td>
                <td style="text-align: center; padding: 12px;">${score.grade || ""}</td>
                <td style="text-align: center; padding: 12px;">${score.cleartype || ""}</td>
                <td style="text-align: center; padding: 12px;">${score.pumpbility || ""}</td>
                <td style="text-align: center; padding: 12px;">${score.timeString || ""}</td>
            `;

            if (idx === 0 && score.chartFail === false && score.cleartype !== "") {
                tr.style.backgroundColor = "#ffd700"; // gold
            } else if (idx === 1 && score.chartFail === false && score.cleartype !== "") {
                tr.style.backgroundColor = "#c0c0c0"; // silver
            } else if (idx === 2 && score.chartFail === false && score.cleartype !== "") {
                tr.style.backgroundColor = "#cd7f32"; // bronze
            } else if (idx >= 3 && idx <= 4 && score.chartFail === false && score.cleartype !== "") {
                tr.style.backgroundColor = "#ea8fff";
            } else if (idx >= 5 && idx <= 19 && score.chartFail === false && score.cleartype !== "") {
                tr.style.backgroundColor = "#63ffc6";
            }
            else {
                tr.style.backgroundColor = "#444";
            }
            // If the score is a failed chart (chartFail true or cleartype empty), use a reddish background and lighter text
            if (score.chartFail === true || score.chartFail === "true" || score.cleartype === "") {
                tr.style.backgroundColor = "#ff4d4d";
                tr.style.color = "#fff";
            }
        });
        
        // Apply initial filters and update ranks
        applyAllFilters();

    } catch (error) {
        console.error("Error loading song leaderboard:", error);

        const leaderboardTable = document.querySelector(".leaderboard");
        if (leaderboardTable) {
            while (leaderboardTable.rows.length > 1) {
                leaderboardTable.deleteRow(1);
            }

            const row = leaderboardTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 9;
            cell.style.textAlign = "center";
            cell.style.color = "#ff6b6b";
            cell.textContent = "Error loading leaderboard";
        }
    }

    // Function to update rank numbers for visible rows
    function updateRanks() {
        const rows = document.querySelectorAll(".leaderboard tr");
        let visibleRank = 1;
        rows.forEach((row, idx) => {
            if (idx === 0) return; // skip header
            if (row.style.display === "none") return;
            const cells = row.querySelectorAll("td");
            if (cells.length < 1) return;
            const rankCell = cells[0];
            rankCell.textContent = visibleRank++;
        });
    }
    
    // Function to apply all active filters and update ranks
    function applyAllFilters() {
        const rateSelect = document.querySelector("#rate");
        const chartSelect = document.querySelector("#chart");
        
        if (!rateSelect || !chartSelect) return;
        
        const selectedRate = rateSelect.value;
        const selectedChart = chartSelect.value;
        
        
        
        const rows = document.querySelectorAll(".leaderboard tr");
        let visibleCount = 0;
        rows.forEach((row, idx) => {
            if (idx === 0) return; // skip header

            const cells = row.querySelectorAll("td");
            if (cells.length < 4) return;
            
            // Check rate filter
            let rateText = cells[3].textContent.trim();
            if (!rateText || rateText === "") rateText = "1.0";
            
            // Normalize rate comparison (handle both string and number formats)
            const rateMatch = selectedRate === "all" || 
                             selectedRate === "" || 
                             rateText === selectedRate || 
                             Number(rateText) === Number(selectedRate);
            
            // Check chart filter
            const difficultyText = cells[2].textContent.trim();
            const chartMatch = selectedChart === "all" || selectedChart === "" || difficultyText === selectedChart;
            
            // Show row only if both filters match
            if (rateMatch && chartMatch) {
                row.style.display = "";
                visibleCount++;
            } else {
                row.style.display = "none";
            }
        });
        
        
        updateRanks();
    }
    
    // Function to reset all filters and show all rows
    function resetAllFilters() {
        const rateSelect = document.querySelector("#rate");
        const chartSelect = document.querySelector("#chart");
        
        if (rateSelect) rateSelect.value = "all";
        if (chartSelect) chartSelect.value = "all";
        
        const rows = document.querySelectorAll(".leaderboard tr");
        rows.forEach((row, idx) => {
            if (idx === 0) return; // skip header
            row.style.display = "";
        });
        
        updateRanks();
    }
    
    // Add reset filters button functionality
    const resetButton = document.querySelector("#resetFilters");
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            resetAllFilters();
        });
    }

    // Rate filtering
    const rateSelect = document.querySelector("#rate");
    if (rateSelect) {
        rateSelect.addEventListener("change", () => {
            applyAllFilters();
        });
    }
    
    // Chart difficulty filtering
    const chartSelect = document.querySelector("#chart");
    if (chartSelect) {
        chartSelect.addEventListener("change", () => {
            applyAllFilters();
        });
    }
});