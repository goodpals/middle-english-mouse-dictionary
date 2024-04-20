/*][%][&][|][>][+][=][-][<][?]
[.]                        [/]
[~]      .P".  _.gbsdP`    [^] 
[^]    dP  .aT"  Y$P'      [~]
[/]    #     #             [*]
[?]    #     #             [%]
[<]    Tb    %             [&]
[-]    Y$.   '        !    [|]
[=]     Yp.          ."    [>]
[+]       `"^T$%$TRP"      [+]
[>]                        [=]  
[|][&][%][*][~][^][/][?][<][-] ontent domain scripts are responsible for injecting or modifying the content of web pages that users visit. The 'content domain' as defined in the manifest JSON consists of scripts sharing a single scope, with this `content.js` being the main script, and listenForTextSelection() being the main driver for this extension's functionality. Content domain scripts do not have permissions for e.g. tab creation, instantiation of local storage keys etc, and so sending messages from the content domain to the background domain is necessary. 

Once HTML is injected into the browser window from a content domain script, it exists within a different scope. So, if you create an HTML button with a function `doThing()` assigned to it, and dothing() is defined in a content domain script, the button in the user's browser no longer has access to that function, and pressing it will produce a reference error.
*/


/** 
 * EVENT LISTENER FOR CLICK + DRAG ON DOM TEXT
 * @summary When the user selects text in their browser, this will: 
 *  1. Check whether the extension is enabled (see: context menu features in background.js)
 *  2. Delete any 'click' listeners for buttons in the modal (the word definitions popup that appears on mouseclick)
 *  3. Set the selected text in local storage (see: openExternalDictionaryQuery() in background.js)
 *  4. get the current selected text and check whether it is the same as before. 
 *  5. If it is, a new modal will be created with new listeners.
 */
! async function listenForTextSelection() {
  document.addEventListener("selectionchange", async function(event) {
    const context = "listenForTextSelection";

    const currentState = await getStateFromStorage(context, "extensionOn");
    if (stateError(context, currentState) || currentState.extensionOn != true) return;

    deleteListenersForModalButtons();    
    setCurrentlySelectedTextInLocalStorage();
    
    const selection = document.getSelection();
    const hasChanged = processSelection(selection.toString().toLowerCase());
    if (!hasChanged) return;

    if (Object.keys(activeWords).length === 0) {
      hideModal();
    } else {
      let printouts = {};
      Object.entries(activeWords).forEach(([key, word]) => printouts[key] = dictionaryEntriesToHTMLtext(word, "modal", null));

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect(); 
      createOrUpdateModal(event, printouts, rect);

      const allMatchedWordEntries = Object.values(activeWords).flatMap(entries => entries);
      createListenersForModalButtons(allMatchedWordEntries);
    }
  });
}();



/**
 * Processes a new selection of HTML text in the DOM. 
 * Removes words that are no longer selected, and adds words that are newly selected.
 * This is agnostic of selection method.
 * @param {string} selection a sentence, potentially a single word
 * @returns {bool} hasChanged
 */
function processSelection(selection) {
  /** @type {Set<string>} */
  const prev = new Set(Object.keys(activeWords));
  const sel = new Set(selection.split(" "));
  
  const newWords = new Set([...sel].filter(x => !prev.has(x)));
  const oldWords = new Set([...prev].filter(x => !sel.has(x)));
  
  for (const word of oldWords) {
    delete activeWords[word];
  }
  for (const word of newWords) {
    const found = searchDictionary(word);
    if (found != null) {
      activeWords[word] = found;
    }
  }
  const updated = new Set(Object.keys(activeWords));
  // console.log("Active words: " + Object.keys(activeWords).join(', '));
  return !areSetsEqual(prev, updated);
} 



/** 
 * Check if the passed-in word matches a key in lookup.json. 
 * The value to this lookup will be an index for an entry in dict.json.
 * @param {string} selectedWord 
 * @returns {Array.<MatchedWordEntry>}
*/
function searchDictionary(selectedWord) {
  // console.log('searching dictionary for ' + selectedWord + ', found: ' + (selectedWord in dictionaryLookupTable));
  if (selectedWord in dictionaryLookupTable) {
    const wordIndexes = dictionaryLookupTable[selectedWord];
    const url = extractBaseURLOfPage();
    let extractedEntries = []; 
    for (index of wordIndexes) {
      /// TODO: change "matchedVariant" to whatever selectedWord is fuzzymatched to once fuzzymatching is implemented
      const entry = new MatchedWordEntry(index, selectedWord, selectedWord, url); 
      extractedEntries.push(entry);
    }
    return extractedEntries;
  } 
  return null;
}



/**
 * This franken-function receives a list of userWordListEntry class objects and uses their index value to get info from the dictionary, and returns it as formatted text.
 * @param {Array.<MatchedWordEntry>} entries
 * @param {string} mode either "modal" or "sidebar"
 * @param {PageInfo} pageData to be used with "sidebar" `mode`. Get extra pre-stored info about the page user is presently on
 * @returns {string} HTML text ready to be passed into a modal/sidebar HTML element constructor, or `null` if there are no entries to parse.
 */
function dictionaryEntriesToHTMLtext(entries, mode, pageData) {
  if (entries == null || entries == undefined) return;
  
  let marginaliaShown = false;
  let text = "";
  
  // build headers where appropriate
  if (entries.length > 1 && mode != "sidebar") text += `<p class="textHeader">` + plaintextToFraktur("Possible Matches")+"</p>";
  if (pageData != null   && mode == "sidebar") {
    text += `<button id="${SIDEBAR_CLOSE_BUTTON_ID}" class="delButton">x</button><br>`;
    text += `<p class="textHeader">` + plaintextToFraktur(pageData.pageName) + "</p><br>";
  }

  // build word info data for each entry
  for (const [index, entry] of entries.entries()) {
    const dictEntry = dictionary[entry.lookupIndex];
    
    const url = "https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=" + entry.usersSelectedWord;
    text += "<p><b><a href=\"" + url + "\"target=\"_blank\" rel=\"noopener\">" + entry.usersSelectedWord + "</a></b>";

    if (dictEntry.partOfSpeech != null) text += ": " + dictEntry.partOfSpeech;

    if (mode != "sidebar") {
      const id = entry.lookupIndex; // must assign this to a const var first
      text += ` <button id="${MODAL_ADDWORD_BUTTON_ID_PREFIX}${id}" class="modalButton">+</button> `;
    }
    text += "</p>";

    if (dictEntry.variants != null) text += "<p>Variants: " + dictEntry.variants.join(", ") + "</p>";
    if (dictEntry.entry != null) text += "<p>" + htmlize(dictEntry.entry) + "</p>";

    // This will display a single, randomised marginalia in any modal with >3 entries, in the middle of the entries.
    // Around 20% of lookup words have > 1 indexes; ~5% have > 2. 
    if ((mode == "modal")
    &&  (marginaliaShown == false)
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2))) {
      let fullURL = browser.runtime.getURL(getRandomImagePath());
      if (fullURL) {
        text += `<img src="${fullURL}" style="width:80%;display:block; margin: 0 auto;">`;
        marginaliaShown = true;
      }
    }

    // Same as for modal, but then that marginalia will be persistent for that page's sidebar for that session.
    if ((mode == "sidebar") 
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2)  )) {
      if (persistentSideBarMarginaliaURL == null) persistentSideBarMarginaliaURL = browser.runtime.getURL(getRandomImagePath());
      text += `<img src="${persistentSideBarMarginaliaURL}" style="width:95%;display:block; margin: 0 auto;">`;
    }
    
    text += "<p>_____</p>";
  }

  return text;
}




