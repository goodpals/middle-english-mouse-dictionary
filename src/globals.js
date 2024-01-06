/* 
  These are accessed by content.js and sidebar.js
*/

// Global variables (brave singletons)
var dictionary = {};
var dictionaryLookupTable = {};
const popupId = 'yeFloatingeWindowe';

/** 
 * @summary the words currently selected by the user in the window, each of which being a key to a `MatchedWordEntry` containing further information.
 * @global
 * @type {Object<string, MatchedWordEntry>} */
var activeWords = {};

/** 
 * @summary each string key is a url
 * @global 
 * @type {Object<string, PageInfo>} */
var userPages = {}; // these keys are param-stripped URLs

/** 
 * @summary the words the user has chosen to be added to their personal log. These word entries can be filtered by e.g. their URL. 
 * @global
 * @type {Array<MatchedWordEntry>} */
var userAddedWords = [];

/** 
 * @summary a list of indexes that correspond to the ids held in buttons appended with event listeners.
 * @global 
 * @type {Array<int>} */
var presentListeners = [];

function clearActiveWords() {
  activeWords = {};
}


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
