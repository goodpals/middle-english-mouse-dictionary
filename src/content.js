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

    deleteListenersForButtons();    
    setCurrentlySelectedTextInLocalStorage();
    
    const selection = document.getSelection();
    const hasChanged = processSelection(selection.toString().toLowerCase());
    if (!hasChanged) return;

    if (Object.keys(activeWords).length === 0) {
      hidePopup();
    } else {
      const keys = Object.keys(activeWords);
      const word = activeWords[keys[keys.length-1]];
      
      const printout = dictionaryEntriesToHTMLtext(word);
      if (printout == null) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect(); 
      createOrUpdatePopup(event, printout, rect);
      createListenersForButtons(word);
    }
  });
}();


/// this is so cursed gode help me but it works
function createListenersForButtons(entries) {
  if (entries == null) return;
  for (const entry of entries) {
    const id = entry.lookupIndex;
    presentListeners.push(id);
    document.querySelector(`#_${id}`).addEventListener('click', event => {
      // console.log("querySelector anonyFuncty: " + entryConst.lookupIndex);
      addWordToUserList(entry);
    });
  }
  // console.log("createListenersForButtons : present listeners: " + presentListeners);
}

function deleteListenersForButtons(){
  for (const id of presentListeners) {
    const button = document.querySelector(`#_${id}`);
    if (button) {
        button.removeEventListener('click', event => {
        addWordToUserList(entry);
      });
    }
  }
  clearPresentListeners();
}


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
 * @param {MouseEvent} event 
 * @param {string} content 
 */
function createOrUpdatePopup(event, content, rect) {
  let popup = findPopup();
  if (popup == null) {
    createPopup(event, content, rect);
  } else {
    popup.innerHTML = content;
  }
}

function hidePopup() {
  const popup = findPopup();

  if (popup != null) {
    popup.remove();
  }
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
 * @returns {string} HTML text ready to be passed into a popup/sidebar HTML element constructor, or `null` if there are no entries to parse.
 */
function dictionaryEntriesToHTMLtext(entries) {
  if (entries == null) return;
  
  let text = "";
  if (entries.length > 1) {
    text += "<h5>Possible Matches:</h5>";
  }

  for (entry of entries) {
    const dictEntry = dictionary[entry.lookupIndex];
    
    let url = "https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=" + entry.usersSelectedWord;

    text += "<p><b><a href=\"" + url + "\"target=\"_blank\" rel=\"noopener\">" + entry.usersSelectedWord + "</a></b>";
    
    if (dictEntry.partOfSpeech != null) {
      text += ": " + dictEntry.partOfSpeech;
    }
    text += "</p>";

    // const stringified = encodeURIComponent(JSON.stringify(entry));
    // console.log(stringified);
    const id = entry.lookupIndex;
    text += `</p><button id="_${id}">Do Thing</button>`;


    // text += `</p><button onclick="javascript: addWordToUserList('${stringified}')">Do Thing</button>`;
    // document.querySelector(`#_${id}`).addEventListener('click', addWordToUserList(id));

    if (dictEntry.variants != null) {
      text += "<p>Variants: " + dictEntry.variants.join(", ") + "</p>";
    }
    if (dictEntry.entry != null) {
      const entryText = dictEntry.entry;
      const htmlizedEntry = htmlize(entryText);
      text += "<p>" + htmlizedEntry + "</p>";
    }
    text += "<p>_____</p>";
  }

  return text;
}



/**
 * @param {MouseEvent} event contains co-ordinates for your mouse position etc.
 * @param {string} content HTML-formatted dictionary entry data
 * @param {DOMRect} rect position data for adjusting the popup location
 */
async function createPopup(event, content, rect) {
  let popup = document.createElement('div');
  popup.id = popupId;
  popup.className = 'singleWordInfoPopup';
  popup.innerHTML = content;

  popup.style.position = 'absolute';
  popup.style.left = (rect.x  + window.scrollX - 120) + 'px';
  popup.style.top = (rect.y + window.scrollY + 35) + 'px';

  const windowWidth = window.outerWidth;

  document.body.appendChild(popup); // the element must be rendered in order to then get the boundingClientRect();
  await promiseNextFrame();

  const popupCoordinates = popup.getBoundingClientRect();
  const popup_rightEdge = popupCoordinates.right;
  const popup_leftEdge = popupCoordinates.left; 

  // deal with the popup rendering outside the window's boundary
  if (popup_rightEdge > windowWidth) {
    const difference = popup_rightEdge - windowWidth;
    const karlMarx = popup_leftEdge - difference - 100; // -100 is a hacke
    const aynRand = popup_rightEdge - difference - 100;
    popup.style.left = karlMarx + 'px'; // style.left takes a STRINGE
    popup.style.right = aynRand + 'px';
  }
}