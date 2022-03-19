import WiktionaryScraper from "js-wiktionary-scraper";

const api = new WiktionaryScraper();
var word_data = await api.fetchData("tank", "English");
console.log(word_data);