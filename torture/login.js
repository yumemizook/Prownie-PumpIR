import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "./firebase.js";

const auth = getAuth();
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "./index.html";
  }
});

let loginButton = document.querySelector("#login");
loginButton.addEventListener("click", async (e) => {
  e.preventDefault();

  // Get the latest values from the input fields
  const emailInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("pw").value;

  if (!emailInput || !passwordInput) {
    alert("Please enter both email and password.");
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    // If successful, onAuthStateChanged will redirect
  } catch (error) {
    switch (error.code) {
      case "auth/invalid-credential":
        alert("Invalid email or password! Please try again.");
        break;
      case "auth/user-not-found":
        alert("User not found! Please create an account.");
        break;
      case "auth/too-many-requests":
        alert("Too many failed attempts. You have been timed out.");
        break;
      case "auth/network-request-failed":
        alert("Network error. Please check your connection and try again.");
        break;
      case "auth/internal-error":
        alert("Internal error. Please try again later");
        break;
      default:
        alert("An error occurred! Contact the sysop of the page.");
        console.error("Error signing in:", error);
        break;
    }
  }
});

const googleButton = document.getElementById("googlelog");
googleButton.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
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
