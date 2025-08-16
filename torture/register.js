import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
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
button.addEventListener("click", validatePasswords);
// technically we only need to check the length since we already enforce
passwordInput.addEventListener("input", function () {
  const passwordlength = passwordInput.value.length;
  const validPassword =
    passwordInput.value.match(upperCaseLetters) &&
    passwordInput.value.match(lowerCaseLetters) &&
    passwordInput.value.match(numbers);
  if (passwordlength == 0) {
    document.getElementById("strength").innerText = "Strength: Empty";
    document.getElementById("strength").style.color = "#888888";
  } else if (passwordlength < 8 && passwordlength != 0) {
    document.getElementById("strength").innerText = "Strength: Bad";
    document.getElementById("strength").style.color = "#ff0000";
  } else if (
    passwordlength >= 8 &&
    passwordlength < 101 &&
    passwordlength != 0 &&
    !validPassword
  ) {
    document.getElementById("strength").innerText =
      "Strength: Needs improvement";
    document.getElementById("strength").style.color = "#ff6200";
  } else if (passwordlength >= 8 && passwordlength < 12 && validPassword) {
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
  } else if (passwordlength == 255 && validPassword) {
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
  let registerButton = document.querySelector("#enter");
  registerButton.addEventListener("click", (e) => {
    e.preventDefault();
  });
  var username = document.getElementById("username").value.trim();
  var email = document.getElementById("email").value.trim();
  var password = document.getElementById("pw").value;
  var confirmPassword = document.getElementById("cpw").value;
  var profilePicture = "/img/default-avatar.png"; // placeholder pfp
  if (username.length < 6) {
    alert("Username is too short! Lengthen it to at least 6 characters.");
    return; // Stop further execution
  } else if (password.length < 8) {
    alert(
      "Password is too short to be secure! Lengthen it to at least 8 characters."
    );
    return; // Stop further execution
  } else if (!password.match(upperCaseLetters)) {
    alert("Password must contain at least one uppercase letter!");
    return; // Stop further execution
  } else if (!password.match(lowerCaseLetters)) {
    alert("Password must contain at least one lowercase letter!");
    return; // Stop further execution
  } else if (!password.match(numbers)) {
    alert("Password must contain at least one number!");
    return; // Stop further execution
  } else if (!email.includes("@")) {
    alert("Email is invalid!");
    return; // Stop further execution
  } else if (password !== confirmPassword) {
    alert("Password must be the same!");
    return; // Stop further execution
  }

  // If all validations pass, proceed with storing user data and redirecting
  else {
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      user = userCredential.user;
      // Update the user's profile immediately after creation
      await updateProfile(user, {
        displayName: username,
        photoURL: profilePicture,
      });
      console.log("User created:", user);
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
        default:
          alert("Error: " + errorMessage);
          break;
      }
      return; // Stop further execution if error occurs
    }
    alert("Account created successfully! Redirecting to home...");
    window.location.href = "index.html";
  }
}

const googleButton = document.getElementById("googlelog");
googleButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
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
