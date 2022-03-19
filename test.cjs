const WiktionaryScraper = require("js-wiktionary-scraper").default;

(async()=>{
    const api = new WiktionaryScraper();
    var word_data = await api.fetchData("tank", "English");
    console.log(word_data);
})();