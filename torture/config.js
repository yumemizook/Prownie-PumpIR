// because recycling is good for the environment, and this is a good practice to do so.
// thanks poicitaco on github for the fixed codebase (former localhost-based code)

import {
  db,
  collection,
  getDocs,
  updateProfile,
  updatePassword,
  updateEmail,
  getAuth,
  onAuthStateChanged,
} from "./firebase.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "./firebase.js"; // update user profile picture? (might be changed if i find a better way)
import { setDoc, doc, getDoc, updateDoc, deleteDoc } from "./firebase.js";
const deleteAccount = document.querySelector("#delete-account");
const wipeScores = document.querySelector("#wipe-scores");
const saveChanges = document.querySelector("[save-modified-changes]");
const savePassword = document.querySelector("[confirm-new-pw]");
const newPasswordInput = document.querySelector("#newpw");
const confirmNewPasswordInput = document.querySelector("#confirmnewpw");


const auth = getAuth();
saveChanges.addEventListener("click", saveData);

document.addEventListener("DOMContentLoaded", () => {
  fetchData();
});

function fetchData() {
  const currentName = document.querySelector("[current-player-name]");
  const currentEmail = document.querySelector("[current-email]");
  const currentAvatar = document.querySelector("#image-display");
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentName.innerHTML = `Current player name: ${user.displayName}`;
      currentEmail.innerHTML = `Current email: ${user.email}`;
      currentAvatar.src = user.photoURL || "img/default-avatar.png";
    }
  });
}

async function saveData() {
  const newName = document.querySelector("#namechange");
  const newEmail = document.querySelector("#emailchange");
  const newAvatar = document.querySelector("#file-upload-link");
  const user = auth.currentUser;

  // Use current values if fields are empty
  const updatedName = newName.value ? newName.value : user.displayName;
  const updatedEmail = newEmail.value ? newEmail.value : user.email;
  const photoURL = newAvatar.value ? newAvatar.value : user.photoURL;

  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const userData = docSnap.data() || {};
    const lastNameChange = userData.lastNameChange || userData.timeCreated || 0;
    const lastUsernames = Array.isArray(userData.lastUsernames) ? userData.lastUsernames : [];
    const timeCreated = userData.timeCreated || 0;
    const nameChangeDue = lastNameChange + 1000 * 60 * 60 * 24 * 7; // 7 days in ms
    const formattedNameChangeDue = new Date(nameChangeDue).toLocaleDateString() + " " + new Date(nameChangeDue).toLocaleTimeString();

    // only 1 name change per 7 days
    if (
      updatedName !== user.displayName &&
      lastNameChange !== timeCreated &&
      nameChangeDue > Date.now()
    ) {
      alert(
        `You have to wait until ${formattedNameChangeDue} before changing your name again.`
      );
      return;
    } else {
      await updateProfile(user, {
        displayName: updatedName,
        photoURL: photoURL,
      });
      await updateDoc(docRef, {
        username: updatedName,
        profilePicture: photoURL,
        lastUsernames: [...lastUsernames, user.displayName],
      });
    }
      // Update email if changed
      if (updatedEmail !== user.email) {
        await updateEmail(user, updatedEmail);
      }
      await updateDoc(docRef, {
        lastNameChange: new Date().getTime(),
      });
      alert("Changes saved");
      window.location.reload();
    // Update profile with new name and photoURL
  } catch (error) {
    alert("Error saving changes. Please try again.");
    console.error("Error saving profile changes:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const deleteAccountWarning = document.getElementById("delete-account-warning");
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Fetch user role from Firestore if not present on user object
      const docRef = doc(db, "users", user.uid);
      getDoc(docRef).then((docSnap) => {
        const userData = docSnap.data();
        if ((user.role === "owner") || (userData && userData.role === "owner")) {
          if (typeof deleteAccount !== "undefined" && deleteAccount.style) {
            deleteAccount.style.display = "none";
            deleteAccountWarning.innerHTML = "You are the owner of the site. You cannot delete your account.";
          }
        }
      });
    }
  });
});

deleteAccount.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You are not logged in.");
    return;
  }
  const confirmed = window.confirm("Are you sure you want to delete your account? This action is irreversible and you won't be allowed to re-register.");
  if (!confirmed) return;
  window.location.href = `/goodbyetotheworld.html?uid=${user.uid}`; // redirect to a goodbye page as a last chance to turn back
});

wipeScores.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You are not logged in.");
    return;
  }
  // Find and delete scores in "songs" subcollections based on player name
  const scoresSnap = await getDocs(collection(db, "users", user.uid, "scores")); // delete from player's own scores
  const songSnap = await getDocs(collection(db, "songs")); // delete from all songs
  const scoresToDelete = [];

  for (const songDoc of songSnap.docs) {
    const songId = songDoc.id;
    const songScoresSnap = await getDocs(collection(db, "songs", songId, "scores"));
    songScoresSnap.forEach((scoreDoc) => {
      const scoreData = scoreDoc.data();
      if (scoreData.player === user.displayName) {
        scoresToDelete.push(scoreDoc.ref);
      }
    });
  }
  if (scoresToDelete.length === 0) {
    alert("You don't have any scores to wipe.");
    return;
  }
  const confirmed = window.confirm("Are you sure you want to wipe all of your scores? This action is irreversible.");
  if (!confirmed) return;

  // Show a temporary message while waiting
  const timer = document.createElement("div");
  timer.style.position = "fixed";
  timer.style.top = "20px";
  timer.style.left = "50%";
  timer.style.transform = "translateX(-50%)";
  timer.style.background = "#383030";
  timer.style.color = "#fff";
  timer.style.padding = "16px 32px";
  timer.style.borderRadius = "8px";
  timer.style.zIndex = "9999";
  let timeLeft = 15000;
  timer.innerHTML = `Wiping scores in ${(timeLeft/1000).toFixed(1)} seconds... <br> Reload page to cancel deletion`;
  document.body.appendChild(timer);

  // Countdown
  const interval = setInterval(() => {
    timeLeft -= 100;
    if (timeLeft > 0) {
      timer.innerHTML = `Wiping scores in ${(timeLeft/1000).toFixed(1)} seconds... <br> Reload page to cancel deletion`;
    }
  }, 100);

  // Wait 15 seconds before deleting
  await new Promise(resolve => setTimeout(resolve, 15000));
  clearInterval(interval);

  try {
    // Delete all scores in parallel
    const deletePromises = [];
    scoresSnap.forEach((scoreDoc) => {
      deletePromises.push(deleteDoc(scoreDoc.ref));
    });
    scoresToDelete.forEach((scoreDoc) => {
      deletePromises.push(deleteDoc(scoreDoc));
    });
    await Promise.all(deletePromises);
    timer.innerHTML = "Scores wiped!";
    setTimeout(() => {
      if (timer.parentNode) timer.parentNode.removeChild(timer);
    }, 2000);
    alert("Scores wiped");
  } catch (err) {
    if (timer.parentNode) timer.parentNode.removeChild(timer);
    alert("An error occurred while wiping scores. Please try again.");
    console.error(err);
  }
});
