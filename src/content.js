/* The content.js file is responsible for injecting or modifying the content of web pages that you visit */

/* 
  WORD LOOKUP LISTENER: this listens for the user double-clicking a word in the DOM and checks the dictionary for that word, making an info popup & adding it to the user's dictionary. The popup then closes on a single click anywhere in the DOM.
*/

// These are global variables
var dictionary = {};
var dictionaryLookupTable = {};

/** GET DICTIONARIES 
 * Instantiate content.js specific dictionary variables, extracted from the JSON files in the `data` directory, by functions in  background.js.
 * This is done because the dictionary files cannot be accessed directly by content.js; they must be first instantiated in background.js, and then loaded into content.js specific global variables by means of a local-storage getter function.
 */
! async function loadDict() {
  dictionary = (await browser.storage.local.get("dictionary")).dictionary;
  // console.log('MEMD (content): Dictionary loaded, length: ' + Object.keys(dictionary).length);
  dictionaryLookupTable = (await browser.storage.local.get("lookup")).lookup;
  // console.log('MEMD (content): Lookup table loaded, length: ' + Object.keys(dictionaryLookupTable).length);
}();



/** @type {Object<string,Array<UserWordListEntry[]>>} */
var activeWords = {};

function clearActiveWords() {
  activeWords = {};
}


/**
 * Processes a new selection. 
 * Removes words that are no longer selected, and adds words that are newly selected.
 * This is agnostic of selection method.
 * @param {string} selection a sentence, potentially a single word
 */
function processSelection(selection){
  /** @type {Set<string>} */
  const cur = new Set(Object.keys(activeWords))
  const sel = new Set(selection.split(" "))
  // console.log([...cur].join(' '));
  // console.log([...sel].join(' '));
  const newWords = new Set([...sel].filter(x => !cur.has(x)));
  const oldWords = new Set([...cur].filter(x => !sel.has(x)));
  for (const word of oldWords) {
    delete activeWords[word];
  }
  for (const word of newWords) {
    const found = searchDictionary(word);
    if (found != null) {
      activeWords[word] = found;
    }
    // else if (found == null) {
    //   browser.runtime.sendMessage({word: word}); // open external MED tab if want
    // }
  }
  console.log("Active words: " + Object.keys(activeWords).join(', '));
} 


/** 
 * EVENT LISTENER FOR CLICK + DRAG ON DOM TEXT
 */
document.addEventListener("selectionchange", async function(event) {
  const currentState = await browser.storage.local.get();
  if (currentState.onOffState != 'on') {
    return;
  }
  // console.log("Selection: "+ document.getSelection().toString().toLowerCase());
  // processSelection(document.getSelection().toString().toLowerCase())
});


/**
 * EVENT LISTENER FOR DOUBLE CLICK ON DOM TEXT
 */
document.addEventListener('dblclick', async function(event) {
  event.preventDefault();

  const currentState = await browser.storage.local.get();
  if (currentState.onOffState != 'on') {
    return;
  }

  const selectedText = window.getSelection().toString().toLowerCase();
  if (selectedText == null || selectedText.length < 2) {
    /// the user is clicking on whitespace, or maybe punctuation? Do not show. Fuck the word 'a' in particular.
    return;
  }

  // processSelection(selectedText);
  const selectedWordInfo = searchDictionary(selectedText); 
  if (selectedWordInfo == null || selectedWordInfo == undefined) {
    // browser.runtime.sendMessage({word: selectedText}); // query MED online dictionary
    return; // User word is not in the dictionary
  }
  
  // All checks passed: style, position, and then show a word info popup
  const printout = getWordInfoPrintout(selectedWordInfo);
  createPopup(event, printout);
  await addToUserWordList(selectedWordInfo, currentState);
});


/**
 * @param {number} lookupIndex a single key to an object in dict.json
 * @param {string} matchedVariant the specific matched variant in lookup.json
 * @param {string} usersSelectedWord the word the user actually tapped (which might not be the same due to fuzzy matching)
*/
class UserWordListEntry {
  constructor(lookupIndex, matchedVariant, usersSelectedWord) {
    this.lookupIndex = lookupIndex;
    this.matchedVariant = matchedVariant;
    this.usersSelectedWord = usersSelectedWord;
  }
}


/* 
  Helper functions begin
*/
async function addToUserWordList(thisWordInfo, state) {
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
  // console.log(userWords);
  // console.log("____");
  await browser.storage.local.set({userWordList: userWords});
  /// Now, when the user opens the UWL side panel from their right-click contextMenu, the updated list will display.
}


/** 
 * Check if the passed-in word matches a key in lookup.json. 
 * The value to this lookup will be an index for an entry in dict.json.
 * @param {string} selectedWord 
*/
function searchDictionary(selectedWord) {
  // console.log('searching dictionary for ' + selectedWord + ', found: ' + (selectedWord in dictionaryLookupTable));
  if (selectedWord in dictionaryLookupTable) {
    const wordIndexes = dictionaryLookupTable[selectedWord];
    // // console.log(wordIndex)

    let extractedEntries = []; 
    for (index of wordIndexes) {
      /// TODO: change "matchedVariant" to whatever selectedWord is fuzzymatched to once fuzzymatching is implemented
      const entry = new UserWordListEntry(index, selectedWord, selectedWord); 
      extractedEntries.push(entry);
    }

    return extractedEntries;
  } else {
    return null;
  }
}


/**
 * This function receives a list of userWordListEntry class objects and uses their index value to get info from the dictionary, and returns it as formatted text.
 * @param {userWordListEntry} info 
 * @returns HTML text ready to be passed into a popup/sidebar HTML element constructor
 */
function getWordInfoPrintout(info) {
  let text = "";
  if (info.length > 1) {
    text += "<h5>Possible Matches:</h5>";
  }

  for (entry of info) {
    const dictEntry = dictionary[entry.lookupIndex];
    
    text += "<p><b>" + entry.usersSelectedWord + "</b>";
    
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


async function createPopup(event, info) {
  let popup = document.createElement('div');
  popup.className = 'singleWordInfoPopup';
  popup.innerHTML = info;

  popup.style.position = 'absolute';
  popup.style.left = (event.clientX + window.scrollX - 100) + 'px';
  popup.style.top = (event.clientY + window.scrollY + 15) + 'px';

  const windowWidth = window.outerWidth;

  // dimensions must be calculated after rendering a DOM instance because this whole system was designed by someone with some kind of serious self-destructive behavioural disorder
  document.body.appendChild(popup); 

  let popup_leftEdge = 0;
  let popup_rightEdge = 0;
  
  await promiseNextFrame();

  const popupCoordinates = popup.getBoundingClientRect();
  popup_rightEdge = popupCoordinates.right;
  popup_leftEdge = popupCoordinates.left; 

  if (popup_rightEdge > windowWidth) {
    const difference = popup_rightEdge - windowWidth;
    const tonyBlair = popup_leftEdge - difference - 100; // -100 is a hacke
    const keirStarmer = popup_rightEdge - difference - 100;

    popup.style.left = tonyBlair + 'px'; // style.left takes a STRINGE
    popup.style.right = keirStarmer + 'px';
  }

  document.addEventListener('click', function(event) {
    document.removeEventListener('click', this);
    popup.remove();
  });
}

function promiseNextFrame(){
  return new Promise(resolve => requestAnimationFrame(resolve)); 
}



// control key functionality prototype (if wanted)
/*
  let isControlPressed = false;

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Control') {
      isControlPressed = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Control') {
      isControlPressed = false;
    }
  });

  document.addEventListener('dblclick', (event) => {
    if (isControlPressed) {
      // Handle control + double-click event here
      // console.log('Control + double-click detected');
    }
  });
*/