# js-wiktionary-scraper
Javascript (ES6/CJS) Wiktionary HTML Scraper

## Usage
### As an ES6 module:
```js
import WiktionaryScraper from "js-wiktionary-scraper";
```
### As a CommonJS module:
```js
const WiktionaryScraper = require("js-wiktionary-scraper").default;
```
### Example:
```js
import WiktionaryScraper from "js-wiktionary-scraper";

const api = new WiktionaryScraper();
var word_data = await api.fetchData("tank", "English");
console.log(word_data);
```
### Will print:
```json
{
  "error": null,
  "url": "https://en.wiktionary.org/wiki/tank",
  "alternatives": null,
  "etymology": [
    "From Portuguese tanque (“tank, liquid container”), originally from Indian vernacular for a large artificial water reservoir, cistern, pool, etc., for example, Gujarati ટાંકી (ṭā̃kī) or Marathi टाकी (ṭākī). the Arabic verb اِسْتَنْقَعَ‎ (istanqaʿa, “to become stagnant, to stagnate”).",
    "In the sense of armoured vehicle, prototypes were described as tanks for carrying water [from 1915] to disguise their nature as well as due to physical resemblance.",
    "(This etymology is missing or incomplete. Please add to it, or discuss it at the Etymology scriptorium.)"
  ],
  "pronunciation": [
    { "IPA": "/tæŋk/", "audio": null, "type": null },
    {
      "IPA": null,
      "audio": "/wiki/File:En-au-tank.ogg",
      "type": "Audio (AU)"
    }
  ],
  "rhymes": "Rhymes: -æŋk",
  "images": [
    {
      "url": "/wiki/File:Defense.gov_News_Photo_041027-F-2034C-010.jpg",
      "caption": "A military tank."
    }
  ],
  "meanings": {
    "preposition": null,
    "proper_noun": null,
    "adjective": null,
    "adverb": null,
    "verb": {
      "head": "tank (third-person singular simple present tanks, present participle tanking, simple past and past participle tanked)",
      "meanings": [Array]
    },
    "noun": { "head": "tank (plural tanks)", "meanings": [Array] },
    "conjunction": null,
    "particle": null
  }
}
```

## Building
### For ES6
```
npm run tsc-es6
```
### For CommonJS
1. Change line 6 in src/index.ts to `import fetch from "node-fetch2";`
2. Run:
```
npm run tsc-cjs
```
3. Rename index.js to index.cjs
**Note:** Of course, you must have TSC installed and added to PATH (for windows)

**Warning**: This project is at an early stage of work-in-progress. Even the most recent version is likely to have serious bugs.