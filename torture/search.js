//very rudimentary search API from scratch because i can't fucking use TMDB API for this project. Why didn't I just go with the movie showcase project instead...
// prolly could leave this for later but nah that's too boring to do
// god i should stop swearing my tutor will be pissed if he sees this mess

//took me a good 30 minutes of struggling to find out what i missed
const songCardtemp = document.querySelector("[data-songcard-template]");
const songCardContainer = document.querySelector("[data-songcards-container]");
const searchInput = document.querySelector("[data-search]");

let song = [];

searchInput.addEventListener("input", (e) => {
  const value = e.target.value.trim().toLowerCase();
  song.forEach((song) => {
    const isVisible = song.title.toLowerCase().includes(value);
    song.element.classList.toggle("hide", !isVisible);
  });
});

// finally made sense of this code, i really fucking need some sleep it's 1:40 as of this writing
// this is a fetch request to get the data from the json "server", and then map the data to the song array
//TODO: make things REDIRECT to the right pages
 fetch(
  "https://my-json-server.typicode.com/yumemizook/Mondstadt-Brownie/songs"
)
  .then((response) => response.json())
  .then((data) => {
    song = data.map((song) => {
      const card = songCardtemp.content.cloneNode(true).children[0];
      const title = card.querySelector("[data-title]");
      const artist = card.querySelector("[data-artist]");
      const series = card.querySelector("[data-series]");
      title.href = `./play/${song.title.split(" ").join("").toLowerCase()}.html`;
      title.target = "_blank";
      title.textContent = song.title;
      artist.textContent = song.artist;
      series.textContent = song.series;

      songCardContainer.append(card);
      return {
        title: song.title,
        artist: song.artist,
        series: song.series,
        element: card,
      };
    });
  });
