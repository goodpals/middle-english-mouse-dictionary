/* 
  Global variables (brave singletons)
  These are accessed by content.js and sidebar.js etc
*/

// PAGE-SCOPED HTML ELEMENT IDs
const modalId = 'yeFloatingeWindowe';
const delSidebarButtonId = 'delSidebar';



// DICTIONARIES

var dictionary = {};
var dictionaryLookupTable = {};

/** 
 * @summary Instantiate content-script specific dictionary variables, extracted from the JSON files in the `data` directory, by functions in  background.js. This is done because the dictionary files cannot be accessed directly by content.js; they must be first instantiated in background.js, and then loaded into content.js specific global variables by means of a local-storage getter function.
 */
! async function loadDict() {
  dictionary = (await browser.storage.local.get("dictionary")).dictionary;
  dictionaryLookupTable = (await browser.storage.local.get("lookup")).lookup;
  // console.log('MEMD (content): Dictionary loaded, length: ' + Object.keys(dictionary).length);
  // console.log('MEMD (content): Lookup table loaded, length: ' + Object.keys(dictionaryLookupTable).length);
}();



// USER DATA STORAGE

/** 
 * @summary the words the user has chosen to be added to their personal log. These word entries can be filtered by e.g. their URL. 
 * @global
 * @type {Array<MatchedWordEntry>} */
var userAddedWords = [];

/** 
 * @summary each string key is a url. When the user adds a word to their `userAddedWords` list, an instance of `PageInfo` will also be added here. 
 * @global 
 * @type {Object<string, PageInfo>} */
var userPages = {}; // these keys are param-stripped URLs



// STATE MANAGEMENT VARIABLES

/** 
 * @summary the words currently selected by the user in the window, each of which being a key to a `MatchedWordEntry` containing further information.
 * @global
 * @type {Object<string, MatchedWordEntry>} */
var activeWords = {};

function clearActiveWords() {
  activeWords = {};
}

/** 
 * @summary presentListeners is a list of indexes that correspond to the ids held in buttons appended with event listeners. These buttons appear in the modal (see: modal.js) popup that gives information about a given word the user selects in the browser. Each possible match for the selected word will have a little button next to it, the pressing of which will add the word to `userAddedWords` (see: globals.js). These listener addresses are disposed of when the user selects new text. 
 * @global 
 * @type {Array<int>} */
var presentListeners = [];

function clearPresentListeners() {
  presentListeners = [];
}

/**
 * @summary each key is the url of a page; each HTMLDivElement is the address of an existing sidebar.
 * @type {Object<string, HTMLDivElement>}
 */
var sidebarStates = {}; /// Tried implementing keeping this in the local storage; didn't work.



// CLASSES

/**
 * @param {number} lookupIndex a single key to an object in dict.json
 * @param {string} matchedVariant the specific matched variant in lookup.json
 * @param {string} usersSelectedWord the word the user actually tapped (which might not be the same due to fuzzy matching)
*/
class MatchedWordEntry {
  constructor(lookupIndex, matchedVariant, usersSelectedWord, url) {
    this.lookupIndex = lookupIndex;
    this.matchedVariant = matchedVariant;
    this.usersSelectedWord = usersSelectedWord;
    this.url = url;
  }
  /// we probably don't need this but on the offchance we REALLY need to check class instance equality JS is Badde
  isEqual(otherEntry) {
    return (
      this.lookupIndex === otherEntry.lookupIndex &&
      this.matchedVariant === otherEntry.matchedVariant &&
      this.usersSelectedWord === otherEntry.usersSelectedWord &&
      this.url === otherEntry.url
    );
  }
}

/**
 * @brief instances of this class should be stored in a list. Check the list for the `sourcePageEntry.pageURL` corresponding to the current page of interest and handle thereafter as required.
 * @param {string} pageName name of the webpage
 * @param {string} favicon address of which
 */
class PageInfo {
  constructor(pageName, favicon) {
    this.pageName = pageName;
    this.favicon = favicon;
  }
}
