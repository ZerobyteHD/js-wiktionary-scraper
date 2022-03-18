# js-wiktionary-scraper
Javascript (ES6/CJS) Wiktionary HTML Scraper

## Usage
As a ES6 module:
```js
import { API } from "js-wiktionary-scraper";
```
As a CommonJS module:
```js
const { API } = require("js-wiktionary-scraper");
```
Then:
```js
var word_data = await API("test");
```

## Building
### For ES6
```
npm run tsc-es6
```
### For CommonJS
```
npm run tsc-cjs
```
**Note:** Of course, you must have TSC installed and added to PATH (for windows)

**Warning**: This project is at an early stage of work-in-progress. Even the most recent is likely to have serious bugs.