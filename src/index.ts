import fetch from "node-fetch";
import { JSDOM } from "jsdom";

/**
 * Search for wiktionary pages
 * @param query The search query
 * @returns Link to a fitting wiktionary page
 */
export async function getWiktionaryPage(query:string) {
    /**
     * 
     * @param word The search query
     * @param array An array of URLs
     * @returns The most likely best fitting URL
     */
    function getMostFittingSearchResultURL(word:string, array:Array<string>):string {
        if(array.length < 1) {
            throw new Error("ArrayLengthError: The passed array has a length under 1");
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
        var res = await fetch("https://en.wiktionary.org/w/api.php?action=opensearch&format=json&formatversion=2&search="+query+"&namespace=0&limit=3");
    } catch(error:any) {
        return {};
    }

    var json = await res.json() as Array<Array<string>>;
    // returned list of URLs
    var urls:Array<string> = json[3];

    if(urls.length > 0) {
        return {success:true, link:getMostFittingSearchResultURL(query, urls)};
    } else {
        return {success:false, link:null, error:"The search did not return any fitting articles"};
    }
}

/**
 * Get the filtered textContent of an HTMLElement
 * @param element HTMLElement: The element whose text should be parsed
 */
export function getElementFilteredText(element:Element) {
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
export function MWMeaningSectionParser(subsectionName:string, currentData:any, hostElement:Element) {
    var internal_sub_name:string = subsectionName.toLowerCase();

    // Is it the headword?
    if(hostElement.querySelector(".headword")) {
        if(!currentData?.meanings) {
            currentData.meanings = {};
        }
        if(!currentData.meanings[internal_sub_name]) {
            currentData.meanings[internal_sub_name] = {head:hostElement.textContent, meanings:[]};
        }
    } else if(hostElement.tagName == "ol") {
        for(var li of hostElement.children) {
            var text = getElementFilteredText(li);
            var object:any = {};
            object.text = text;
            if(li.querySelector("dl")) {
                object.example = li.querySelector("dl").textContent;
            }
            currentData.meanings[internal_sub_name].meanings.push(object);
        }
    }

    // recursive
    return currentData;
}

/**
 * Returns the collected data of a MW-Section
 * @param MWElement The MW head element
 * @param currentData The collected data
 * @param sectionName Name of the section
 * @returns Current Data
 */
export function wikiMWElementParser(MWElement:Element, currentData:any={}, sectionName:string="None"):any {
    if(currentData == undefined)currentData = {};
    if(MWElement == null)return currentData;
    if(MWElement.tagName == "H2" && MWElement?.children[0]?.classList.contains(".mw-headline")) {
        // found new section
        return currentData;
    }

    if(MWElement.tagName != "H3") {
        if(sectionName == "Alternative_forms") {
            currentData.alternatives = {};
            currentData.alternatives.raw = MWElement.textContent;
        } else if(sectionName == "Etymology") {
            if(!currentData.etymology)currentData.etymology = [];
            if(MWElement.textContent != "\n")
            currentData.etymology.push(MWElement.textContent);
        } else if(sectionName == "Pronunciation") {
            if(MWElement.tagName == "UL") {
                if(!currentData?.pronunciation)currentData.pronunciation = [];

                var lis = MWElement.children;
                for(var li of lis) {
                    // is rhyme info
                    if((li as HTMLElement).textContent.startsWith("Rhymes")) {
                        currentData.rhymes = (li as HTMLElement).textContent;
                        continue;
                    }

                    // is audio
                    var object:any = {};
                    var ipa = li.querySelector(".IPA") as HTMLElement;
                    object.IPA = ipa ? ipa.textContent : "None";

                    var audio = li.querySelector(".audiometa > a");
                    object.audio = audio ? audio.getAttribute("href") : "None";

                    var type = li.querySelector(".unicode") as HTMLElement;
                    object.type = type ? type.textContent : "None";
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
    } else if(MWElement.tagName == "H3") {
        sectionName = MWElement.children[0].id;
    }
    
    // !recursion
    return wikiMWElementParser(MWElement.nextElementSibling as HTMLElement, currentData, sectionName);
}

export function docGetLangSectionByTitle(id:string, document:Document) {
    var h2s = document.querySelectorAll(".mw-parser-output h2");
    for(var h2 of h2s) {
        if(h2.children) {
            if(h2.children.length > 0)
            if(h2.children[0].id == id) {
                return h2;
            }
        }
    }
    return null;
}

export async function parse_wiki(wiki_url:string) {
    try {
        var res = await fetch(wiki_url);
    } catch(error:any) {
        return {error:"Network error"};
    }
    var html:string = await res.text();
    var doc = (new JSDOM(html)).window.document;

    var mw_english = docGetLangSectionByTitle("English", doc);
    var data = wikiMWElementParser(mw_english, {url:wiki_url});
    return data;
}

export async function API(query:string) {
    var q:any = await getWiktionaryPage(query);
    if(q.success) {
        var data:any = await parse_wiki(q.link);
        return data;
    } else {
        return {error: "Could not find wiki"};
    }
}