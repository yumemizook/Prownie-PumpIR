import { getFirestore, collection, getDocs, doc, getDoc, setDoc, db, getAuth } from "./firebase.js";

const auth = getAuth();
const nameElem = document.querySelector(".songinfo h1");
// const artistElem = document.querySelector(".songinfo h4");
// const seriesElem = document.querySelector(".songinfo h5");

document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    const songRef = doc(db, "songs", id);
    const songDoc = await getDoc(songRef);
    if (songDoc.exists()) {
        const songData = songDoc.data();
        if (nameElem) nameElem.textContent = songData.name;
        // if (artistElem) artistElem.textContent = songData.artist;
        // if (seriesElem) seriesElem.textContent = songData.series;
    }
});