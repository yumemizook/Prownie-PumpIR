import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from "./firebase.js";
import { db, addDoc, collection, setDoc, doc, getDoc } from "./firebase.js";
const auth = getAuth();

let lowerCaseLetters = /[a-z]/g;
let upperCaseLetters = /[A-Z]/g;
let numbers = /[0-9]/g;

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "./index.html";
  }
});

var button = document.getElementById("enter");
var passwordInput = document.getElementById("pw");

// Prevent form submission and validate passwords
button.addEventListener("click", (e) => {
  e.preventDefault();
  validatePasswords();
});

// Password strength checker
passwordInput.addEventListener("input", function () {
  const passwordlength = passwordInput.value.length;
  const validPassword =
    passwordInput.value.match(upperCaseLetters) &&
    passwordInput.value.match(lowerCaseLetters) &&
    passwordInput.value.match(numbers);

  if (passwordlength === 0) {
    document.getElementById("strength").innerText = "Strength: Empty";
    document.getElementById("strength").style.color = "#888888";
  } else if (passwordlength < 8) {
    document.getElementById("strength").innerText = "Strength: Bad";
    document.getElementById("strength").style.color = "#ff0000";
  } else if (passwordlength >= 8 && passwordlength < 12 && !validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Needs improvement";
    document.getElementById("strength").style.color = "#ff6200";
  } else if (passwordlength >= 8 && passwordlength < 10 && validPassword) {
    document.getElementById("strength").innerText = "Strength: OK";
    document.getElementById("strength").style.color = "#f5ce42";
  } else if (passwordlength >= 10 && passwordlength < 12 && validPassword) {
    document.getElementById("strength").innerText = "Strength: Medium";
    document.getElementById("strength").style.color = "#9ad104";
  } else if (passwordlength >= 12 && passwordlength < 14 && validPassword) {
    document.getElementById("strength").innerText = "Strength: Good";
    document.getElementById("strength").style.color = "#23d104";
  } else if (passwordlength >= 14 && passwordlength < 20 && validPassword) {
    document.getElementById("strength").innerText = "Strength: Strong";
    document.getElementById("strength").style.color = "#04d1a8";
  } else if (passwordlength >= 20 && passwordlength < 30 && validPassword) {
    document.getElementById("strength").innerText = "Strength: Very Strong";
    document.getElementById("strength").style.color = "#0489d1";
  } else if (passwordlength >= 30 && passwordlength < 50 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Is this even necessary?";
    document.getElementById("strength").style.color = "#0434d1";
  } else if (passwordlength >= 50 && passwordlength < 100 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Either you have perfect memory or you have a password manager to do this huh...";
    document.getElementById("strength").style.color = "#6004d1";
  } else if (passwordlength >= 100 && passwordlength < 120 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Why are you even doing this.";
    document.getElementById("strength").style.color = "#ce04d1";
  } else if (passwordlength >= 120 && passwordlength < 150 && validPassword) {
    document.getElementById("strength").innerText = "Strength: ...";
    document.getElementById("strength").style.color = "#fd96ff";
  } else if (passwordlength >= 150 && passwordlength < 200 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: You really don't know when to quit huh...";
    document.getElementById("strength").style.color = "#fd96ff";
  } else if (passwordlength >= 200 && passwordlength < 204 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Please stop. You are really getting on my nerves.";
    document.getElementById("strength").style.color = "#ff42b4";
  } else if (passwordlength >= 204 && passwordlength < 214 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: I'm getting tired of this. Just quit it already while you can.";
    document.getElementById("strength").style.color = "#ff0073";
  } else if (passwordlength >= 214 && passwordlength < 230 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Why are you even doing this? Stop this at once!";
    document.getElementById("strength").style.color = "#ff738f";
  } else if (passwordlength >= 230 && passwordlength < 255 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: You are gonna regret this.";
    document.getElementById("strength").style.color = "#ff0000";
  } else if (passwordlength === 255 && validPassword) {
    window.open("./pie.html", "_blank");
    document.getElementById("strength").innerText =
      "Strength: Ya like it? You are a true maniac.";
    document.getElementById("strength").style.color = "#ffffff";
  } else if (passwordlength >= 256 && passwordlength < 300 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: Ya like it? You are a true maniac.";
    document.getElementById("strength").style.color = "#ffffff";
  } else if (passwordlength >= 300 && validPassword) {
    document.getElementById("strength").innerText =
      "Strength: There really are no more easter eggs. You can make it a million characters long if you want to at this point. I give up.";
    document.getElementById("strength").style.color = "#888888";
  }
});

async function validatePasswords() {
  var username = document.getElementById("username").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("pw").value;
  var confirmPassword = document.getElementById("cpw").value;
  var profilePicture = "/img/default-avatar.png"; // placeholder pfp

  // Validation checks
  if (username.length < 6) {
    alert("Username is too short! Lengthen it to at least 6 characters.");
    return;
  }

  if (password.length < 8) {
    alert(
      "Password is too short to be secure! Lengthen it to at least 8 characters."
    );
    return;
  }

  if (!password.match(upperCaseLetters)) {
    alert("Password must contain at least one uppercase letter!");
    return;
  }

  if (!password.match(lowerCaseLetters)) {
    alert("Password must contain at least one lowercase letter!");
    return;
  }

  if (!password.match(numbers)) {
    alert("Password must contain at least one number!");
    return;
  }

  if (!email.includes("@")) {
    alert("Email is invalid!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Password must be the same!");
    return;
  }

  // If all validations pass, proceed with creating user
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    user.sendEmailVerification();

    // Update the user's profile immediately after creation
    await updateProfile(user, {
      displayName: username,
      photoURL: profilePicture,
    });

    // Add user to Firestore database
    await setDoc(doc(db, "users", user.uid), {
      username: username,
      email: email,
      profilePicture: profilePicture,
      pumpbility: 0,
      role: "user",
      timeCreated: Date.now(),
      uid: user.uid,
    });

    console.log("User created:", user);
    alert("Account created successfully! Redirecting to home...");
    window.location.href = "index.html";
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Error creating user:", errorCode, errorMessage);

    switch (errorCode) {
      case "auth/email-already-in-use":
        alert(
          "This email is already in use. If you want to use this email, please reset your password."
        );
        break;
      case "auth/invalid-email":
        alert(
          "The email address is not valid. Please enter a valid email address."
        );
        break;
      case "auth/weak-password":
        alert("Password is too weak. Please choose a stronger password.");
        break;
      default:
        alert("Error: " + errorMessage);
        break;
    }
  }
}

const googleButton = document.getElementById("googlelog");
googleButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user already exists in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      // Add user to Firestore if not present
      await setDoc(userDocRef, {
        username: user.displayName || "Player",
        email: user.email || "",
        profilePicture: user.photoURL || "/img/default-avatar.png",
        pumpbility: 0,
        role: "user",
        timeCreated: Date.now(),
        uid: user.uid,
      });
    }

    console.log("User signed in with Google:", user);
    window.location.href = "index.html";
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    switch (errorCode) {
      case "auth/popup-closed-by-user":
        alert(
          "Popup closed by user. Please avoid closing the popup during sign-in."
        );
        break;
      case "auth/cancelled-popup-request":
        alert("Popup request cancelled. Please try again.");
        break;
      default:
        console.error("Error signing in with Google:", errorCode, errorMessage);
        alert(
          "An error occurred while signing in with Google. Please try again."
        );
    }
  }
});
