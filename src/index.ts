import fetch from "node-fetch";
import parse from "node-html-parser";

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