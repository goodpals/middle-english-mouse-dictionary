/* The content.js file is responsible for injecting or modifying the content of web pages that you visit */

/* 
  WORD LOOKUP LISTENER: this listens for the user double-clicking a word in the DOM and checks the dictionary for that word, making an info popup & adding it to the user's dictionary. The popup then closes on a single click anywhere in the DOM.
*/


// SETUP & EVENT LISTENERS BEGIN

/** 
 * Instantiate content.js specific dictionary variables, extracted from the JSON files in the `data` directory, by functions in  background.js.
 * This is done because the dictionary files cannot be accessed directly by content.js; they must be first instantiated in background.js, and then loaded into content.js specific global variables by means of a local-storage getter function.
 */
! async function loadDict() {
  dictionary = (await browser.storage.local.get("dictionary")).dictionary;
  dictionaryLookupTable = (await browser.storage.local.get("lookup")).lookup;
  // console.log('MEMD (content): Dictionary loaded, length: ' + Object.keys(dictionary).length);
  // console.log('MEMD (content): Lookup table loaded, length: ' + Object.keys(dictionaryLookupTable).length);
}();


/** 
 * EVENT LISTENER FOR CLICK + DRAG ON DOM TEXT
 */
! async function listenForTextSelection() {
  document.addEventListener("selectionchange", async function(event) {
    const currentState = await browser.storage.local.get();
    if (currentState.onOffState != 'on') return;

    deleteListenersForModalButtons();    
    setCurrentlySelectedTextInLocalStorage();
    
    const selection = document.getSelection();
    const hasChanged = processSelection(selection.toString().toLowerCase());
    if (!hasChanged) return;

    if (Object.keys(activeWords).length === 0) {
      hideModal();
    } else {
      const keys = Object.keys(activeWords);
      const word = activeWords[keys[keys.length-1]];
      
      const printout = dictionaryEntriesToHTMLtext(word, "modal", null);
      if (printout == null) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect(); 
      createOrUpdateModal(event, printout, rect);
      createListenersForModalButtons(word);
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
 * This function receives a list of userWordListEntry class objects and uses their index value to get info from the dictionary, and returns it as formatted text.
 * @param {Array.<MatchedWordEntry>} entries
 * @param {string} mode either "modal" or "sidebar"
 * @param {PageInfo} pageData to be used with "sidebar" `mode`. Get extra pre-stored info about the page user is presently on
 * @returns {string} HTML text ready to be passed into a modal/sidebar HTML element constructor, or `null` if there are no entries to parse.
 */
function dictionaryEntriesToHTMLtext(entries, mode, pageData) {
  if (entries == null) return;
  
  let text = "";
  
  // build headers where appropriate
  if (entries.length > 1 && mode != "sidebar") text += "<h5>Possible Matches:</h5>";
  if (pageData != null   && mode == "sidebar") {
    text += `<button id="${delSidebarButtonId}" class="delButton">x</button><br>`;
    text += "<h6>" + pageData.pageName + "</h6><br>";
  }

  // build word info data for each entry
  for (entry of entries) {
    const dictEntry = dictionary[entry.lookupIndex];
    
    let url = "https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=" + entry.usersSelectedWord;

    text += "<p><b><a href=\"" + url + "\"target=\"_blank\" rel=\"noopener\">" + entry.usersSelectedWord + "</a></b>";

    if (dictEntry.partOfSpeech != null) text += ": " + dictEntry.partOfSpeech;

    if (mode != "sidebar") {
      const id = entry.lookupIndex;
      text += ` <button id="_${id}" class="modalButton">+</button> `;
    }

    text += "</p>";

    if (dictEntry.variants != null) text += "<p>Variants: " + dictEntry.variants.join(", ") + "</p>";

    if (dictEntry.entry != null) {
      const entryText = dictEntry.entry;
      const htmlizedEntry = htmlize(entryText);
      text += "<p>" + htmlizedEntry + "</p>";
    }
    text += "<p>_____</p>";
  }

  return text;
}


