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
    
    const selection = document.getSelection();
    const hasChanged = processSelection(selection.toString().toLowerCase());
    if (!hasChanged) return;

    if (activeWords.length === 0) {
      // hide popup
    } else {
      const keys = Object.keys(activeWords);
      const printout = dictionaryEntriesToHTMLtext(activeWords[keys[keys.length-1]]);
      if (printout == null) return;
      // if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect(); 
        console.log('Selection position:', rect.left, rect.top);
      // }
      createOrUpdatePopup(event, printout, rect);
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


/* 
  Helper functions begin
*/

async function addToSidebarWordlist(thisWordInfo, state) {
  const content = state.userWordList;
  let userWords = Array.from(content);
  
  // console.log(userWords) /// this log should not contain any information about the word that has just been clicked.

  const hasCommonIndex = userWords.some(userWordsEntry => {
    return thisWordInfo.some(selectedEntry => {
      return userWordsEntry.lookupIndex === selectedEntry.lookupIndex;
    });
  });
  if (hasCommonIndex == true) {
    // console.log(hasCommonIndex + ': true : has Common word, not adding to list')
    return; /// selected word is already in dict
  }
  // console.log(hasCommonIndex + ': false : no Common word, adding to list')
  for (entry of thisWordInfo) {
    userWords.push(entry);
  }
  await browser.storage.local.set({userWordList: userWords});
  /// Now, when the user opens the UWL side panel from their right-click contextMenu, the updated list will display.
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

    let extractedEntries = []; 
    for (index of wordIndexes) {
      /// TODO: change "matchedVariant" to whatever selectedWord is fuzzymatched to once fuzzymatching is implemented
      const entry = new MatchedWordEntry(index, selectedWord, selectedWord); 
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


function htmlize(entry) {
  const boldRegex = /#([^#]+)#/g;
  const replacedHashtags = entry.replace(boldRegex, (match, p1) => `<b>${p1}</b>`);  
  const italicRegex = /_([^_]+)_/g;
  const replacedUnderscores = replacedHashtags.replace(italicRegex, (match, p1) => `<i>${p1}</i>`);

  return replacedUnderscores;
}


/**
 * @param {MouseEvent} event 
 * @param {string} content 
 */
async function createOrUpdatePopup(event, content, rect) {
  let popup = findPopup();
  if (popup == null) {
    createPopup(event, content, rect);
  } else {
    popup.innerHTML = content;
  }
}


/**
 * @returns {HTMLElement | null}
 */
function findPopup() {
  return document.getElementById(popupId);
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

  document.addEventListener('mousedown', function(event) {
    // use a mousedown rather than a `click` to avoid issues with click+drag->release mouse being regarded a 'click' and triggering this listener
    document.removeEventListener('mousedown', this);
    popup.remove();
  });
}


function promiseNextFrame(){
  return new Promise(resolve => requestAnimationFrame(resolve)); 
}


// 🙄
const areSetsEqual = (a, b) =>
  a.size === b.size && [...a].every((value) => b.has(value));



/**
 * EVENT LISTENER FOR DOUBLE CLICK ON DOM TEXT
*/
// document.addEventListener('dblclick', async function(event) {
//   event.preventDefault();

//   const currentState = await browser.storage.local.get();
//   if (currentState.onOffState != 'on') {
//     return;
//   }

//   const selectedText = window.getSelection().toString().toLowerCase();
//   if (selectedText == null || selectedText.length < 2) {
//     /// the user is clicking on whitespace, or maybe punctuation? Do not show. Fuck the word 'a' in particular.
//     return;
//   }

//   // processSelection(selectedText);
//   const selectedWordInfo = searchDictionary(selectedText); 
//   if (selectedWordInfo == null || selectedWordInfo == undefined) {
//     // browser.runtime.sendMessage({word: selectedText}); // query MED online dictionary
//     return; // User word is not in the dictionary
//   }
  
//   // All checks passed: style, position, and then show a word info popup
//   const printout = getWordInfoPrintout(selectedWordInfo);
//   createPopup(event, printout);
//   await addToSidebarWordlist(selectedWordInfo, currentState);
// });
