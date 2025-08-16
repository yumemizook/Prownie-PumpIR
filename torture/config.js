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
import { setDoc, doc, getDoc, updateDoc } from "./firebase.js";

const saveChanges = document.querySelector("[save-modified-changes]");
const savePassword = document.querySelector("[confirm-new-pw]");
const newPasswordInput = document.querySelector("#newpw");
const confirmNewPasswordInput = document.querySelector("#confirmnewpw");

const auth = getAuth();
let user = auth.currentUser;
const storage = getStorage();

let lowerCaseLetters = /[a-z]/g;
let upperCaseLetters = /[A-Z]/g;
let numbers = /[0-9]/g;

// coming back to this later
saveChanges.addEventListener("click", saveData);
// savePassword.addEventListener("click", changePassword);

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
    const lastNameChange = docSnap.data().lastNameChange;
    const timeCreated = docSnap.data().timeCreated;
    const nameChangeDue = lastNameChange + 60000 * 60 * 24 * 7;
    const formattedNameChangeDue = new Date(nameChangeDue).toLocaleDateString() + " " + new Date(nameChangeDue).toLocaleTimeString();
    if (nameChangeDue > new Date().getTime() && lastNameChange !== timeCreated && updatedName !== user.displayName) { // if the user has changed their name in the last 7 days, they cannot change it again
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
      });
      // Update email if changed
      if (updatedEmail !== user.email) {
        await updateEmail(user, updatedEmail);
      }
      await updateDoc(docRef, {
        lastNameChange: new Date().getTime(),
      });
      alert("Changes saved");
      window.location.reload();
    }
    // Update profile with new name and photoURL
  } catch (error) {
    alert("Error saving changes. Please try again.");
    console.error("Error saving profile changes:", error);
  }
}
