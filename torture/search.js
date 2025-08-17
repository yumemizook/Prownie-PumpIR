import { collection, getDocs, db } from "./firebase.js";

const searchType = document.getElementById("search-type");
const searchInput = document.querySelector("[data-search]");
const searchContainer = document.querySelector("[data-container]");
const searchTemplate = document.querySelector("[data-template]");

// Store all users in a global variable after fetching once
let allUsers = [];

document.addEventListener("DOMContentLoaded", async () => {
  await fetchUsers();
});

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

    // Clear previous results before rendering new cards
    searchContainer.innerHTML = "";

    // allUsers.forEach((user) => {
    //   const card = searchTemplate.content.cloneNode(true);
    //   const titleLink = card.querySelector("[data-title]");
    //   const pfp = card.querySelector("[data-pfp]");
    //   pfp.src =
    //     user.profilePicture &&
    //     typeof user.profilePicture === "string" &&
    //     user.profilePicture.trim() !== ""
    //       ? user.profilePicture
    //       : "img/default-avatar.png";
    //   const username =
    //     typeof user.username === "string" && user.username.trim() !== ""
    //       ? user.username
    //       : typeof user.displayName === "string" && user.displayName.trim() !== ""
    //       ? user.displayName
    //       : "Unknown User";
    //   titleLink.textContent = username;
    //   titleLink.href = `user.html?name=${encodeURIComponent(username)}`;
    //   const pumpbillDiv = card.querySelector("[data-artist]");
    //   let pumpbilityValue = "0";
    //   if (
    //     user.pumpbility !== undefined &&
    //     user.pumpbility !== null &&
    //     user.pumpbility !== ""
    //   ) {
    //     pumpbilityValue = user.pumpbility;
    //   }
    //   pumpbillDiv.textContent = "Pumpbility: " + pumpbilityValue;
    //   const timeDiv = card.querySelector("[data-series]");
    //   // Format timeCreated if it's a timestamp
    //   if (user.timeCreated) {
    //     let timeString = "";
    //     if (typeof user.timeCreated === "number") {
    //       const date = new Date(user.timeCreated);
    //       if (!isNaN(date.getTime())) {
    //         timeString = date.toLocaleString("en-GB", { hour12: false });
    //       } else {
    //         timeString = user.timeCreated.toString();
    //       }
    //     } else if (
    //       typeof user.timeCreated === "string" &&
    //       user.timeCreated.trim() !== ""
    //     ) {
    //       timeString = user.timeCreated;
    //     }
    //     if (timeString) {
    //       timeDiv.textContent = "Joined: " + timeString;
    //     } else {
    //       timeDiv.textContent = "";
    //     }
    //   } else {
    //     timeDiv.textContent = "";
    //   }
    //   searchContainer.appendChild(card);
    // });
  } catch (err) {
    allUsers = [];
    // Optionally log the error for debugging
    // console.error("Error fetching users:", err);
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
          : typeof user.displayName === "string" && user.displayName.trim() !== ""
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
          : typeof user.displayName === "string" && user.displayName.trim() !== ""
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
// Fix the searchInput event listener to debounce input and avoid excessive calls

let searchTimeout = null;

searchInput.addEventListener("input", () => {
  const searchValue = searchInput.value.trim().toLowerCase();
  searchContainer.innerHTML = "";

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Debounce: wait 300ms after user stops typing
  searchTimeout = setTimeout(async () => {

    try {
      await searchUsers(searchValue);
    } catch (error) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error";
      errorDiv.textContent = "An error occurred while searching.";
      searchContainer.appendChild(errorDiv);
      console.error("Search error:", error);
    }
  }, 300);
});