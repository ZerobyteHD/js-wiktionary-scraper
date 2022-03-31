import WiktionaryScraper from "js-wiktionary-scraper";

const api = new WiktionaryScraper();
var word_data = await api.fetchData("tank", "English");
console.log(word_data);

// Retrieve image
var image = await word_data.images[0].url.getFullMedia();
console.log(image);

// Audio
var audio = await word_data.pronunciation[1].audio.getFullMedia();
console.log(audio);