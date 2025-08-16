import { getAuth, onAuthStateChanged, signOut, getDoc, doc, db } from "./firebase.js";

// Helper to ensure avatar is loaded even if DOM is not ready when onAuthStateChanged fires
function setAvatarImage(user) {
  // Try to get the avatar element, retry if not found
  let tries = 0;
  function trySet() {
    const avatar = document.querySelector("#avatardisp");
    if (avatar) {
      avatar.src = user.photoURL || "img/default-avatar.png";
    } else if (tries < 10) {
      tries++;
      setTimeout(trySet, 100);
    }
  }
  trySet();
}

function setAvatarFrameDisplay(show) {
  let tries = 0;
  function trySet() {
    const avatarFrame = document.querySelector("#avatar");
    if (avatarFrame) {
      avatarFrame.style.display = show ? "block" : "none";
    } else if (tries < 10) {
      tries++;
      setTimeout(trySet, 100);
    }
  }
  trySet();
}

function setWelcomeText(text) {
  let tries = 0;
  function trySet() {
    const welcomeText = document.querySelector("#name");
    if (welcomeText) {
      welcomeText.textContent = text;
    } else if (tries < 10) {
      tries++;
      setTimeout(trySet, 100);
    }
  }
  trySet();
}

function setPumpbilityHTML(html) {
  let tries = 0;
  function trySet() {
    const pumpbility = document.querySelector("#pb");
    if (pumpbility) {
      pumpbility.innerHTML = html;
    } else if (tries < 10) {
      tries++;
      setTimeout(trySet, 100);
    }
  }
  trySet();
}

function setLoginButtonHTML(html, addSignOutListener = false, auth = null) {
  let tries = 0;
  function trySet() {
    const loginButton = document.querySelector("#logger");
    if (loginButton) {
      loginButton.innerHTML = html;
      if (addSignOutListener && auth) {
        const signOutLink = document.querySelector("#signout");
        if (signOutLink) {
          signOutLink.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
              await signOut(auth);
              window.location.href = "/index.html";
            } catch (error) {
              console.error("Error signing out:", error);
              alert("An error occurred while signing out. Please try again.");
            }
          });
        }
      }
    } else if (tries < 10) {
      tries++;
      setTimeout(trySet, 100);
    }
  }
  trySet();
}

const auth = getAuth();
onAuthStateChanged(auth, async (user) => {
  if (user) {
    setAvatarImage(user);
    setAvatarFrameDisplay(true);
    setWelcomeText(user.displayName || "User");
    // Set pumpbility (fetch from Firestore)
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const pb = userDocSnap.exists() && typeof userDocSnap.data().pumpbility === "number"
        ? userDocSnap.data().pumpbility
        : 0;
      setPumpbilityHTML(`<h3>Pumpbility: ${pb}</h3>`);
    } catch (e) {
      setPumpbilityHTML(`<h3>Pumpbility: nothing</h3>`);
    }
    setLoginButtonHTML(`<a href="javascript:void(0)" id="signout">Sign Out</a>`, true, auth);
  } else {
    setAvatarFrameDisplay(false);
    // Clear avatar image
    let tries = 0;
    function clearAvatar() {
      const avatar = document.querySelector("#avatardisp");
      if (avatar) {
        avatar.src = "";
      } else if (tries < 10) {
        tries++;
        setTimeout(clearAvatar, 100);
      }
    }
    clearAvatar();
    setWelcomeText("");
    setPumpbilityHTML("");
    setLoginButtonHTML(`<a href="/login.html">Login</a>`);
  }
});