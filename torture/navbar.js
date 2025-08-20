import { getAuth, onAuthStateChanged, signOut, getDoc, doc, db } from "./firebase.js";

const pumpbilityColors = [
  { pumpbility: 0, color: "rgb(183, 250, 255)" },
  { pumpbility: 2000, color: "rgb(47, 154, 255)" },
  { pumpbility: 4000, color: "rgb(0, 255, 115)" },
  { pumpbility: 6000, color: "rgb(141, 255, 47)" },
  { pumpbility: 8000, color: "rgb(255, 255, 125)" },
  { pumpbility: 10000, color: "rgb(255, 12, 12)" },
  { pumpbility: 12000, color: "rgb(153, 0, 255)" },
  { pumpbility: 15000, color: "rgb(133, 102, 0)" },
  { pumpbility: 20000, color: "rgb(179, 179, 179)" },
  { pumpbility: 24000, color: "rgb(255, 238, 0)" },
  { pumpbility: 26000, color: "rgb(143, 212, 203)" },
  { pumpbility: 30000, color: "linear-gradient(90deg, rgb(255, 87, 87) 0%, rgb(255, 190, 92) 20%, rgba(208, 222, 33, 1) 40%, rgb(171, 255, 138) 60%, rgb(100, 255, 162) 80%, rgba(47, 201, 226, 1) 100%" },
  { pumpbility: 35000, color: "linear-gradient(90deg,rgba(251, 255, 8, 1) 0%, rgba(255, 3, 255, 1) 25%, rgba(0, 38, 255, 1) 50%, rgba(0, 242, 255, 1) 75%, rgba(0, 255, 170, 1) 100%)" },
];

function getPumpbilityColor(value) {
  let lastColor = pumpbilityColors[0].color;
  for (const entry of pumpbilityColors) {
    if (value >= entry.pumpbility) {
      lastColor = entry.color;
    } else {
      break;
    }
  }
  return lastColor;
}

function setPumpbilityColor(value) {
  const pumpbility = document.querySelector("#pb");
  if (pumpbility) {
    // If the color is a gradient, set background and text color
    const color = getPumpbilityColor(value);
    if (color.startsWith("linear-gradient")) {
      pumpbility.style.background = color;
      pumpbility.style.webkitTextFillColor = "transparent";
      pumpbility.style.color = "transparent";
      pumpbility.style.webkitBackgroundClip = "text";
      pumpbility.style.backgroundClip = "text";
      //make it look like how it is displayed in chunithm
    } else {
      pumpbility.style.color = color;
    }
  }
}

// Helper to ensure avatar is loaded even if DOM is not ready when onAuthStateChanged fires
function setAvatarImage(user) {
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
    // Fetch user document to check for ban and get pumpbility
    let pb = 0;
    let userData = {};
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        if (userData.role === "banned") {
          // Banned user: show banned state
          setAvatarFrameDisplay(false);
          setWelcomeText("");
          setPumpbilityHTML("");
          setLoginButtonHTML(`<a href="javascript:void(0)" id="signout">Sign Out</a>`, true, auth);
          setPumpbilityColor(0);
          // Set avatar to default and clear name
          const nameElem = document.querySelector("#name");
          if (nameElem) nameElem.innerHTML = "";
          const avatarFrame = document.querySelector("#avatar");
          if (avatarFrame) avatarFrame.style.display = "none";
          return;
        }
        pb = typeof userData.pumpbility === "number" ? userData.pumpbility : 0;
      }
      setAvatarImage(user);
      setAvatarFrameDisplay(true);
      setWelcomeText(user.displayName || "User");
      setPumpbilityHTML(`<h3>Pumpbility: ${pb}</h3>`);
    } catch (e) {
      setAvatarImage(user);
      setAvatarFrameDisplay(true);
      setWelcomeText(user.displayName || "User");
      setPumpbilityHTML(`<h3>Pumpbility: nothing</h3>`);
      pb = 0;
    }
    setPumpbilityColor(pb);
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
    setPumpbilityColor(0);
  }
});