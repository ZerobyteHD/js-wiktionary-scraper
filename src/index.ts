/**
 * @author Zerobyte
 * @license MIT
 */

import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export interface WiktionarySearchResult {
    link: string|null;
    success: boolean;
    error: string|null;
}

export interface WiktionaryAlternativesData {
    raw: string;
}

export interface WiktionaryImagesData {
    url: string;
    caption: string;
}

export interface WiktionaryPronunciationData {
    IPA: string|null;
    audio: string|null;
    type: string|null;
}

export interface WiktionaryMeaningData {
    head: string;
    meanings: Array<string>;
}

export interface WiktionaryMeaningsData {
    proper_noun: WiktionaryMeaningData|null;
    adjective: WiktionaryMeaningData|null;
    noun: WiktionaryMeaningData|null;
    verb: WiktionaryMeaningData|null;
    adverb: WiktionaryMeaningData|null;
    conjunction: WiktionaryMeaningData|null;
    preposition: WiktionaryMeaningData|null;
    particle: WiktionaryMeaningData|null;
}

export interface WiktionaryDataResult {
    error: string|null;
    url: string;
    alternatives: WiktionaryAlternativesData|null;
    etymology: Array<string>|null;
    pronunciation: Array<WiktionaryPronunciationData>|null;
    rhymes: string|null;
    images: Array<WiktionaryImagesData>|null;
    meanings: WiktionaryMeaningsData|null;
}

/**
 * Search for wiktionary pages
 * @param query The search query
 * @param subdomain The wiktionary subdomain
 * @returns Link to a fitting wiktionary page
 */
export async function getWiktionaryPage(query:string, subdomain="en"):Promise<WiktionarySearchResult> {
    /**
     * 
     * @param word The search query
     * @param array An array of URLs
     * @returns The most likely best fitting URL; Returns null if the array has a length below 1
     */
    function getMostFittingSearchResultURL(word:string, array:Array<string>):string|null {
        if(array.length < 1) {
            return null;
        }

        for(var item of array) {
            // The url has the query at the end
            if(item.endsWith(word))return item;
        }
        for(var item of array) {
            // The url has the query in lower case at the end
            if(item.endsWith(word.toLowerCase()))return item;
        }
        return array[0];
    }

    try {
        // API search call
        var res = await fetch("https://"+subdomain+".wiktionary.org/w/api.php?action=opensearch&format=json&formatversion=2&search="+query+"&namespace=0&limit=3", {});
    } catch(error:any) {
        return {success: false, error: error, link:null};
    }

    var json = await res.json() as Array<Array<string>>;
    // returned list of URLs
    var urls:Array<string> = json[3];

    if(urls.length > 0) {
        return {success:true, link:getMostFittingSearchResultURL(query, urls), error:null};
    } else {
        return {success:false, link:null, error:"The search did not return any fitting articles"};
    }
}

/**
 * Get the filtered textContent of an HTMLElement
 * @param element HTMLElement: The element whose text should be parsed
 */
export function getElementFilteredText(element:Element):string {
    var text:string = "";

    for(var child of element.childNodes) {
        if(["A","I","B","SPAN","P"].includes((child as Element)?.tagName)) {
            text += (child as unknown as HTMLElement).textContent;
        } else if(child.nodeType == 3) {
            text += child.textContent;
        }
    }

    return text.replace(/\n/g, "");
}

/**
 * Parses the subsections of the MW-meaning section
 * @param subsectionName Subsection type
 * @param currentData Current data (passed recursively)
 * @param hostElement The subsection element
 */
export function MWMeaningSectionParser(subsectionName:string, currentData:WiktionaryDataResult, hostElement:Element):WiktionaryDataResult {
    var internal_sub_name:string = subsectionName.toLowerCase();

    // Is it the headword?
    if(hostElement.querySelector(".headword")) {
        if(!currentData.meanings) {
            currentData.meanings = {preposition:null, proper_noun:null, adjective:null, adverb:null, verb: null, noun:null, conjunction:null, particle:null};
        }
        // @ts-ignore
        if(!currentData.meanings[internal_sub_name]) {
            // @ts-ignore
            currentData.meanings[internal_sub_name] = {head:hostElement.textContent.replace(/\n/g, ""), meanings:[]};
        }
    } else if(hostElement.tagName == "OL") {
        for(var li of hostElement.children) {
            var text = getElementFilteredText(li);
            var object:any = {};
            object.text = text;
            if(li.querySelector("dl")) {
                object.example = li.querySelector("dl").textContent;
            }
            // @ts-ignore
            currentData.meanings[internal_sub_name].meanings.push(object);
        }
    }

    // recursive
    return currentData;
}


/**
 * Identifies the normalized id of a subsection
 * @param subheaderId The id, e.g. Etymology_4
 * @returns The normalized id
 */
export function identifySubsectionHeader(subheaderId:string):string|null {
    const knownIDs = ["Proper_noun", "Noun", "Verb", "Adverb", "Adjective", "Conjunction", "Preposition", "Particle", "Alternative_forms", "Etymology", "Pronunciation"];
    if(knownIDs.includes(subheaderId))return subheaderId;
    for(var knownID of knownIDs) {
        if((new RegExp(knownID+"_\\d{1,}")).test(subheaderId)) {
            return knownID;
        }
    }
    return null;
}

/**
 * Returns the collected data of a MW-Section
 * @param MWElement The MW head element
 * @param currentData The collected data
 * @param sectionName Name of the section
 * @param firstRun Recursive helper that indicates the first run
 * @returns Current Data
 */
export function wikiMWElementParser(MWElement:Element, currentData:WiktionaryDataResult, sectionName:string="None", firstRun:boolean=true):WiktionaryDataResult {

    if(MWElement == null)return currentData;
    if(!firstRun && MWElement.tagName == "H2" && MWElement?.children[0]?.classList.contains("mw-headline")) {
        // found new section
        return currentData;
    }
    firstRun = false;

    if(MWElement.tagName != "H3" && MWElement.tagName != "H4") {
        if(sectionName == "Alternative_forms") {
            currentData.alternatives = {raw: MWElement.textContent};
        } else if(sectionName == "Etymology") {
            if(!currentData.etymology)currentData.etymology = [];
            if(MWElement.textContent != "\n")
            currentData.etymology.push(MWElement.textContent.replace(/\n/g, ""));
        } else if(sectionName == "Pronunciation") {
            if(MWElement.tagName == "UL") {
                if(!currentData.pronunciation)currentData.pronunciation = [];

                var lis = MWElement.children;
                for(var li of lis) {
                    // is rhyme info
                    if((li as HTMLElement).textContent.startsWith("Rhymes")) {
                        currentData.rhymes = (li as HTMLElement).textContent;
                        continue;
                    }

                    // is audio
                    var object:WiktionaryPronunciationData = {IPA: null, audio: null, type:null};
                    var ipa = li.querySelector(".IPA") as HTMLElement;
                    object.IPA = ipa ? ipa.textContent : null;

                    var audio = li.querySelector(".audiometa > a");
                    object.audio = audio ? audio.getAttribute("href") : null;

                    var type = li.querySelector(".unicode") as HTMLElement;
                    object.type = type ? type.textContent : null;
                    currentData.pronunciation.push(object);
                }
            }
        } else if(["Proper_noun", "Noun", "Verb", "Adverb", "Adjective", "Conjunction", "Preposition", "Particle"].includes(sectionName)) {
            currentData = MWMeaningSectionParser(sectionName, currentData, MWElement);
        }
    }

    if(MWElement.classList.contains("thumb")) {
        // is image
        if(!currentData.images)currentData.images = [];
        var image = {
            url: MWElement.querySelector("a.image")?.getAttribute("href"),
            caption: MWElement.querySelector(".thumbcaption")?.textContent
        }
        currentData.images.push(image);
    } else if(MWElement.tagName == "H3" || MWElement.tagName == "H4") {
        sectionName = identifySubsectionHeader(MWElement.children[0].id) || "None";
    }
    
    // !recursion
    return wikiMWElementParser(MWElement.nextElementSibling as HTMLElement, currentData, sectionName, firstRun);
}

/**
 * Returns the h2 element of the section specified by id or null if it does not exist
 * @param id The id of the section, e.g. 'English' or 'German'
 * @param document The document element
 * @returns h2-HTMLElement | null
 */
export function docGetLangSectionByTitle(id:string, document:Document):HTMLElement|null {
    var h2s = document.querySelectorAll(".mw-parser-output h2");
    for(var h2 of h2s) {
        if(h2.children) {
            if(h2.children.length > 0)
            if(h2.children[0].id == id) {
                return h2 as HTMLElement;
            }
        }
    }
    return null;
}

/**
 * Returns the parsed data of a specified wiki page specified by URL
 * @param wiki_url The URL of the page to be parsed
 * @returns Parsed data
 */
export async function parseWiki(wiki_url:string, languageId:string):Promise<WiktionaryDataResult> {
    try {
        var res = await fetch(wiki_url, {});
    } catch(error:any) {
        return {error:"Network error", rhymes:null, url:wiki_url, alternatives:null, etymology:null, pronunciation:null, images:null, meanings:null};
    }
    var html:string = await res.text();
    var doc = (new JSDOM(html)).window.document;

    var mw_lang_head = docGetLangSectionByTitle(languageId, doc);
    if(!mw_lang_head) {
        return {alternatives:null, url:wiki_url, etymology:null, images:null, pronunciation:null, rhymes:null, meanings:null, error:"Could not find language section "+languageId};
    }

    var d:WiktionaryDataResult = {error: null, url: null, alternatives:null, etymology:null, pronunciation:null, rhymes:null, images:null, meanings:null};
    d.url = wiki_url;

    var data = wikiMWElementParser(mw_lang_head, d);

    if(!data.alternatives)data.alternatives=null;
    if(!data.error)data.error=null;
    if(!data.etymology)data.etymology=null;
    if(!data.images)data.images=null;
    if(!data.pronunciation)data.pronunciation=null;
    if(!data.rhymes)data.rhymes=null;

    return data;
}

/**
 * Main class: Wiktionary Scraper
 */
export default class WiktionaryScraper {
    subdomain:string;

    /**
     * 
     * @param _subdomain The wiktionary subdomain, e.g. 'en' for en.wiktionary.org
     */
    constructor(_subdomain:string = "en") {
        this.subdomain = _subdomain;
    }
    /**
     * Searches wiktionary and returns the parsed content of the most fitting search result page
     * @param query The query for the search
     * @returns Parsed data or error object
     */
    async fetchData(query:string, languageId:string="English"):Promise<WiktionaryDataResult> {
        var page = await getWiktionaryPage(query, this.subdomain);
        if(page.success) {
            var data = await parseWiki(page.link, languageId);
            return data;
        } else {
            return {error: page.error, etymology:null, pronunciation:null, url:null, alternatives:null, rhymes:null, images:null, meanings:null};
        }
    }
}