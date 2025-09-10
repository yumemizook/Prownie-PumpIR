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
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "./firebase.js";
import { setDoc, doc, getDoc, updateDoc, deleteDoc } from "./firebase.js";

const deleteAccount = document.querySelector("#delete-account");
const wipeScores = document.querySelector("#wipe-scores");
const saveChanges = document.querySelector("[save-modified-changes]");
const savePassword = document.querySelector("[confirm-new-pw]");
const newPasswordInput = document.querySelector("#newpw");
const confirmNewPasswordInput = document.querySelector("#confirmnewpw");
const changeAvatar = document.querySelector("#file-upload-link");
const currentAvatar = document.querySelector("#image-display");
const changeBanner = document.querySelector("#banner");
const currentBanner = document.querySelector("#banner-display");

const auth = getAuth();
saveChanges.addEventListener("click", saveData);

document.addEventListener("DOMContentLoaded", () => {
  fetchData();
});

async function fetchData() {
  const currentName = document.querySelector("[current-player-name]");
  const currentEmail = document.querySelector("[current-email]");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let userData = {};
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        userData = userDocSnap.exists() ? userDocSnap.data() : {};
      } catch (e) {
        userData = {};
      }   
        currentName.innerHTML = `Current player name: ${user.displayName || userData.username || ""}`;    
        currentEmail.innerHTML = `Current email: ${user.email || userData.email || ""}`;
        currentAvatar.src = user.photoURL || userData.profilePicture || "img/default-avatar.png";
        currentBanner.src = userData.banner || "";
        console.log(userData.banner);
    }
  });
}
let photoURL;
async function saveData() {
  const newName = document.querySelector("#namechange");
  const newEmail = document.querySelector("#emailchange");
  const newAvatar = document.querySelector("#file-upload-link");
  const user = auth.currentUser;

  // Use current values if fields are empty
  const updatedName = newName.value ? newName.value : user.displayName;
  const updatedEmail = newEmail.value ? newEmail.value : user.email;
  try {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    const userData = docSnap.data() || {};
    const lastNameChange = userData.lastNameChange || userData.timeCreated || 0;
    const lastUsernames = Array.isArray(userData.lastUsernames)
      ? userData.lastUsernames
      : [];
    const timeCreated = userData.timeCreated || 0;
    const nameChangeDue = lastNameChange + 1000 * 60 * 60 * 24 * 7; // 7 days in ms
    const formattedNameChangeDue =
      new Date(nameChangeDue).toLocaleDateString() +
      " " +
      new Date(nameChangeDue).toLocaleTimeString();

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
      });
      await updateDoc(docRef, {
        username: updatedName,
        lastUsernames:
          updatedName !== user.displayName
            ? [...lastUsernames, user.displayName]
            : lastUsernames,
      });
    }
    // Update email if changed
    if (updatedEmail !== user.email) {
      await updateEmail(user, updatedEmail);
    }
    await updateDoc(docRef, {
      lastNameChange: new Date().getTime(),
    });
const alert = document.createElement("div");
    alert.innerHTML = "Changes saved";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#383030";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    document.querySelector("#namechange").value = "";
    document.querySelector("#emailchange").value = "";
    // Update profile with new name and photoURL
  } catch (error) {
    const alert = document.createElement("div");
    alert.innerHTML = "Error saving changes. Please try again.";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#ff4b42";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    console.error("Error saving profile changes:", error);
  }
}
// preview avatar
changeAvatar.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  const user = auth.currentUser;
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);
  formData.append("image", file);
  // Show local preview immediately
  currentAvatar.src = URL.createObjectURL(file);
  try {
    const response = await fetch(
      "https://api.imgbb.com/1/upload?key=50cf99d6a3e01eb23c9afe2f863b7f43",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (data && data.data && data.data.url) {
      currentAvatar.src = data.data.url;
      console.log(data.data.url);
      await updateProfile(user, {
        photoURL: data.data.url,
      });
      await updateDoc(userDocRef, {
        profilePicture: data.data.url,
      });
      const alert = document.createElement("div");
      alert.innerHTML = "Avatar uploaded successfully.";
      alert.style.position = "fixed";
      alert.style.top = "20px";
      alert.style.left = "50%";
      alert.style.transform = "translateX(-50%)";
      alert.style.background = "#383030";
      alert.style.color = "#fff";
      alert.style.padding = "16px 32px";
      alert.style.borderRadius = "8px";
      alert.style.zIndex = "9999";
      document.body.appendChild(alert);
      setTimeout(() => {
        if (alert.parentNode) alert.parentNode.removeChild(alert);
      }, 2000);
    } else {
      throw new Error("Invalid response from image upload service.");
    }
  } catch (err) {
    const alert = document.createElement("div");
    alert.innerHTML = "Error uploading avatar. Please try again.";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#ff4b42";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    console.error("Avatar upload error:", err);
  }

});
changeBanner.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  const user = auth.currentUser;
  const userDocRef = doc(db, "users", user.uid);
  const userDocSnap = await getDoc(userDocRef);
  formData.append("image", file);
  // Show local preview immediately
  currentBanner.src = URL.createObjectURL(file);
  try {
    const response = await fetch(
      "https://api.imgbb.com/1/upload?key=50cf99d6a3e01eb23c9afe2f863b7f43",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (data && data.data && data.data.url) {
      currentBanner.src = data.data.url;
      console.log(data.data.url);
      await updateDoc(userDocRef, {
        banner: data.data.url,
      });
      const alert = document.createElement("div");
      alert.innerHTML = "Banner uploaded successfully.";
      alert.style.position = "fixed";
      alert.style.top = "20px";
      alert.style.left = "50%";
      alert.style.transform = "translateX(-50%)";
      alert.style.background = "#383030";
      alert.style.color = "#fff";
      alert.style.padding = "16px 32px";
      alert.style.borderRadius = "8px";
      alert.style.zIndex = "9999";
      document.body.appendChild(alert);
      setTimeout(() => {
        if (alert.parentNode) alert.parentNode.removeChild(alert);
      }, 2000);
    } else {
      throw new Error("Invalid response from image upload service.");
    }
  } catch (err) {
    const alert = document.createElement("div");
    alert.innerHTML = "Error uploading banner. Please try again.";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#ff4b42";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    console.error("Banner upload error:", err);
  }

});


document.addEventListener("DOMContentLoaded", () => {
  const deleteAccountWarning = document.getElementById(
    "delete-account-warning"
  );
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Fetch user role from Firestore if not present on user object
      const docRef = doc(db, "users", user.uid);
      getDoc(docRef).then((docSnap) => {
        const userData = docSnap.data();
        if (user.role === "owner" || (userData && userData.role === "owner")) {
          if (typeof deleteAccount !== "undefined" && deleteAccount.style) {
            deleteAccount.style.display = "none";
            deleteAccountWarning.innerHTML =
              "You are the owner of the site. You cannot delete your account.";
          }
        }
      });
    }
  });
});

savePassword.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    const alert = document.createElement("div");
    alert.innerHTML = "You are not logged in.";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#ff4b42";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    return;
  }
  const oldPasswordInput = document.querySelector("#oldpw");
  const oldPassword = oldPasswordInput ? oldPasswordInput.value : "";
  const newPassword = newPasswordInput.value;
  const confirmNewPassword = confirmNewPasswordInput.value;

  if (!oldPassword) {
    const alert = document.createElement("div");
    alert.innerHTML = "Please enter your current password.";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#ff4b42";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    return;
  }

  // Re-authenticate user with old password
  try {
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
  } catch (err) {
    alert("Current password is incorrect.");
    if (oldPasswordInput) oldPasswordInput.value = "";
    newPasswordInput.value = "";
    confirmNewPasswordInput.value = "";
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New password does not match.");
    return;
  }

  try {
    await updatePassword(user, newPassword);
    const alert = document.createElement("div");
    alert.innerHTML = "Password changed successfully.";
    alert.style.position = "fixed";
    alert.style.top = "20px";
    alert.style.left = "50%";
    alert.style.transform = "translateX(-50%)";
    alert.style.background = "#383030";
    alert.style.color = "#fff";
    alert.style.padding = "16px 32px";
    alert.style.borderRadius = "8px";
    alert.style.zIndex = "9999";
    document.body.appendChild(alert);
    setTimeout(() => {
      if (alert.parentNode) alert.parentNode.removeChild(alert);
    }, 2000);
    document.querySelector("#oldpw").value = "";
    document.querySelector("#newpw").value = "";
    document.querySelector("#confirmnewpw").value = "";
  } catch (err) {
    alert("Failed to change password. Please try again.");
    console.error("Password update error:", err);
  }
});

deleteAccount.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You are not logged in.");
    return;
  }
  const confirmed = window.confirm(
    "Are you sure you want to delete your account? This action is irreversible and you won't be allowed to re-register."
  );
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
    const songScoresSnap = await getDocs(
      collection(db, "songs", songId, "scores")
    );
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
  const confirmed = window.confirm(
    "Are you sure you want to wipe all of your scores? This action is irreversible."
  );
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
  timer.innerHTML = `Wiping scores in ${(timeLeft / 1000).toFixed(
    1
  )} seconds... <br> Reload page to cancel deletion`;
  document.body.appendChild(timer);

  // Countdown
  const interval = setInterval(() => {
    timeLeft -= 100;
    if (timeLeft > 0) {
      timer.innerHTML = `Wiping scores in ${(timeLeft / 1000).toFixed(
        1
      )} seconds... <br> Reload page to cancel deletion`;
    }
  }, 100);

  // Wait 15 seconds before deleting
  await new Promise((resolve) => setTimeout(resolve, 15000));
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
