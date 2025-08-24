import { collection, getDocs, db } from "./firebase.js";

const searchType = document.getElementById("search-type");
const searchInput = document.querySelector("[data-search]");
const searchContainer = document.querySelector("[data-container]");
const searchTemplate = document.querySelector("[data-template]");

// Store all users in a global variable after fetching once
let allUsers = [];
let allSongs = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (searchType.value === "users") {
    await fetchUsers();
  } else if (searchType.value === "songs") {
    await fetchSongs();
  }
});

// Add event listener for search type changes
searchType.addEventListener("change", async () => {
  // Clear search input and results when switching types
  searchInput.value = "";
  searchContainer.innerHTML = "";

  // Reset the search timeout to prevent any pending searches
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }

  if (searchType.value === "users") {
    await fetchUsers();
  } else if (searchType.value === "songs") {
    await fetchSongs();
  }
});

// Fetch songs by song name (search)
async function fetchSongs() {
  try {
// Access the songs collection
    const songsCol = collection(db, "songs");
    const songsSnapshot = await getDocs(songsCol);

    if (songsSnapshot.empty) {
      console.log("No songs found in 'songs' collection");
      allSongs = [];
      searchContainer.innerHTML = "";
      const noResult = document.createElement("div");
      noResult.className = "no-result";
      noResult.textContent = "No songs found in database.";
      searchContainer.appendChild(noResult);
      return;
    }

    // Map available songs (excluding deleted/hidden)
    allSongs = songsSnapshot.docs
      .map((doc) => {
        try {
          const song = doc.data();

          // Ensure song has required fields
          if (!song || typeof song !== "object") {
            return null;
          }

          // Add document ID to song object
          song.id = doc.id;

          // Exclude deleted/hidden songs if they have a flag
          if (song.deleted === true || song.hidden === true) {
            return null;
          }

          // Ensure song has a name
          if (
            !song.name ||
            typeof song.name !== "string" ||
            song.name.trim() === ""
          ) {
            return null;
          }

          return song;
        } catch (docError) {
          return null;
        }
      })
      .filter((song) => song !== null);

    // Clear previous results before rendering new cards
    searchContainer.innerHTML = "";

    // Show all songs when initially loading (no search filter)
    if (allSongs.length === 0) {
      const noResult = document.createElement("div");
      noResult.className = "no-result";
      noResult.textContent = "No songs found.";
      searchContainer.appendChild(noResult);
      return;
    }

    // Display all songs initially
    allSongs.forEach((song) => {
      const card = searchTemplate.content.cloneNode(true);
      const titleLink = card.querySelector("[data-title]");
      const pfp = card.querySelector("[data-pfp]");
      pfp.style.display = "none";
      const title = card.querySelector("[data-title]");
      title.style.fontSize = "1.2rem";
      const artist = card.querySelector("[data-artist]");
      artist.style.fontSize = "0.8rem";
      const series = card.querySelector("[data-series]");
      series.style.fontSize = "0.8rem";
      titleLink.textContent = song.name || "Untitled Song";
      titleLink.href = `song.html?id=${song.id}`;
      artist.textContent = song.artist || "Unknown Artist";
      series.textContent = song.series || "Unknown Series";

      searchContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error in fetchSongs:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
    });

    allSongs = [];
    searchContainer.innerHTML = "";
    const errorDiv = document.createElement("div");
    errorDiv.className = "no-result";
    errorDiv.textContent = "Error fetching songs: " + err.message;
    searchContainer.appendChild(errorDiv);
  }
}

// fetch all users and store in allUsers
async function fetchUsers() {
  try {
    const usersCol = collection(db, "users");
    const usersSnapshot = await getDocs(usersCol);
    allUsers = usersSnapshot.docs.map((doc) => {
      const user = doc.data();
      user.id = doc.id;
      return user;
    });

    // Remove banned users from allUsers array
    allUsers = allUsers.filter(
      (user) => !(user.role && user.role.includes("banned"))
    );

    // Clear previous results before rendering new cards
    searchContainer.innerHTML = "";

    // Display all users when initially loading (no search filter)
    if (allUsers.length === 0) {
      const noResult = document.createElement("div");
      noResult.className = "no-result";
      noResult.textContent = "No users found.";
      searchContainer.appendChild(noResult);
      return;
    }

    allUsers.forEach((user) => {
      const card = searchTemplate.content.cloneNode(true);

      const titleLink = card.querySelector("[data-title]");
      // Prefer username, then displayName, then name, then fallback
      const username =
        typeof user.username === "string" && user.username.trim() !== ""
          ? user.username
          : typeof user.displayName === "string" &&
            user.displayName.trim() !== ""
          ? user.displayName
          : typeof user.name === "string" && user.name.trim() !== ""
          ? user.name
          : "Unknown User";
      titleLink.textContent = username;
      // Link to user.html?name=... for consistency
      titleLink.href = `user.html?name=${encodeURIComponent(username)}`;

      const pfp = card.querySelector("[data-pfp]");
      pfp.src =
        user.profilePicture &&
        typeof user.profilePicture === "string" &&
        user.profilePicture.trim() !== ""
          ? user.profilePicture
          : "img/default-avatar.png";

      const pumpbillDiv = card.querySelector("[data-artist]");
      // Show "Pumpbility: <value>" if available, otherwise 0
      let pumpbilityValue = "0";
      if (
        user.pumpbility !== undefined &&
        user.pumpbility !== null &&
        user.pumpbility !== ""
      ) {
        pumpbilityValue = user.pumpbility;
      }
      pumpbillDiv.textContent = "Pumpbility: " + pumpbilityValue;

      const timeDiv = card.querySelector("[data-series]");
      // Format timeCreated if it's a timestamp
      if (user.timeCreated) {
        let timeString = "";
        if (typeof user.timeCreated === "number") {
          const date = new Date(user.timeCreated);
          if (!isNaN(date.getTime())) {
            timeString = date.toLocaleString("en-GB", { hour12: false });
          } else {
            timeString = user.timeCreated.toString();
          }
        } else if (
          typeof user.timeCreated === "string" &&
          user.timeCreated.trim() !== ""
        ) {
          timeString = user.timeCreated;
        }
        if (timeString) {
          timeDiv.textContent = "Joined: " + timeString;
        } else {
          timeDiv.textContent = "";
        }
      } else {
        timeDiv.textContent = "";
      }
      searchContainer.appendChild(card);
    });
  } catch (err) {
    allUsers = [];
    // Optionally log the error for debugging
    console.error("Error fetching users:", err);
  }
}

async function searchUsers(searchValue) {
  try {
    // Filter users from the pre-fetched allUsers array
    const filteredUsers = allUsers.filter((user) => {
      // Try to match on username, displayName, or name (case-insensitive)
      const username =
        typeof user.username === "string" && user.username.trim() !== ""
          ? user.username
          : typeof user.displayName === "string" &&
            user.displayName.trim() !== ""
          ? user.displayName
          : typeof user.name === "string" && user.name.trim() !== ""
          ? user.name
          : "";
      return username.toLowerCase().includes(searchValue);
    });

    if (filteredUsers.length === 0) {
      const noResult = document.createElement("div");
      noResult.className = "no-result";
      noResult.textContent = "No players found.";
      searchContainer.appendChild(noResult);
      return;
    }

    filteredUsers.forEach((user) => {
      const card = searchTemplate.content.cloneNode(true);

      const titleLink = card.querySelector("[data-title]");
      // Prefer username, then displayName, then name, then fallback
      const username =
        typeof user.username === "string" && user.username.trim() !== ""
          ? user.username
          : typeof user.displayName === "string" &&
            user.displayName.trim() !== ""
          ? user.displayName
          : typeof user.name === "string" && user.name.trim() !== ""
          ? user.name
          : "Unknown User";
      titleLink.textContent = username;
      // Link to user.html?name=... for consistency
      titleLink.href = `user.html?name=${encodeURIComponent(username)}`;

      const pfp = card.querySelector("[data-pfp]");
      pfp.src =
        user.profilePicture &&
        typeof user.profilePicture === "string" &&
        user.profilePicture.trim() !== ""
          ? user.profilePicture
          : "img/default-avatar.png";

      const pumpbillDiv = card.querySelector("[data-artist]");
      // Show "Pumpbility: <value>" if available, otherwise 0
      let pumpbilityValue = "0";
      if (
        user.pumpbility !== undefined &&
        user.pumpbility !== null &&
        user.pumpbility !== ""
      ) {
        pumpbilityValue = user.pumpbility;
      }
      pumpbillDiv.textContent = "Pumpbility: " + pumpbilityValue;

      const timeDiv = card.querySelector("[data-series]");
      // Format timeCreated if it's a timestamp
      if (user.timeCreated) {
        let timeString = "";
        if (typeof user.timeCreated === "number") {
          const date = new Date(user.timeCreated);
          if (!isNaN(date.getTime())) {
            timeString = date.toLocaleString("en-GB", { hour12: false });
          } else {
            timeString = user.timeCreated.toString();
          }
        } else if (
          typeof user.timeCreated === "string" &&
          user.timeCreated.trim() !== ""
        ) {
          timeString = user.timeCreated;
        }
        if (timeString) {
          timeDiv.textContent = "Joined: " + timeString;
        } else {
          timeDiv.textContent = "";
        }
      } else {
        timeDiv.textContent = "";
      }
      searchContainer.appendChild(card);
    });
  } catch (err) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = "Error fetching players.";
    searchContainer.appendChild(errorDiv);
  }
}

// Add song search functionality
async function searchSongs(searchValue) {
  try {
    // Clear previous results before displaying search results
    searchContainer.innerHTML = "";

    // Filter songs from the pre-fetched allSongs array
    const filteredSongs = allSongs.filter((song) => {
      // Search by song name (case-insensitive)
      const songName = song.name || "";
      return songName.toLowerCase().includes(searchValue);
    });

    if (filteredSongs.length === 0) {
      const noResult = document.createElement("div");
      noResult.className = "no-result";
      noResult.textContent = "No songs found.";
      searchContainer.appendChild(noResult);
      return;
    }

    filteredSongs.forEach((song) => {
      const card = searchTemplate.content.cloneNode(true);

      const titleLink = card.querySelector("[data-title]");
      titleLink.textContent = song.name || "Untitled Song";
      titleLink.href = `song.html?id=${song.id}`;
      titleLink.style.fontSize = "1.2rem";
      titleLink.style.fontWeight = "bold";


      const pfp = card.querySelector("[data-pfp]");
      pfp.style.display = "none"; // hide the avatar
      const artistDiv = card.querySelector("[data-artist]");
      artistDiv.textContent = song.artist || "Unknown Artist";
      const seriesDiv = card.querySelector("[data-series]");
      seriesDiv.textContent = song.series || "";
      artistDiv.style.fontSize = "0.8rem";
      seriesDiv.style.fontSize = "0.8rem";
      searchContainer.appendChild(card);
    });
  } catch (err) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = "Error searching songs.";
    searchContainer.appendChild(errorDiv);
    console.error("Song search error:", err);
  }
}

// Fix the searchInput event listener to debounce input and avoid excessive calls
let searchTimeout = null;

searchInput.addEventListener("input", () => {
  const searchValue = searchInput.value.trim().toLowerCase();

  // Clear container immediately when input changes
  searchContainer.innerHTML = "";

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Debounce: wait 300ms after user stops typing
  searchTimeout = setTimeout(async () => {
    try {
      // Call appropriate search function based on selected type
      if (searchType.value === "users") {
        if (searchValue === "") {
          // Show all users when search is empty
          await fetchUsers();
        } else {
          await searchUsers(searchValue);
        }
      } else if (searchType.value === "songs") {
        if (searchValue === "") {
          // Show all songs when search is empty
          await fetchSongs();
        } else {
          await searchSongs(searchValue);
        }
      }
    } catch (error) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = "An error occurred while searching.";
      searchContainer.appendChild(errorDiv);
      console.error("Search error:", error);
    }
  }, 300);
});
