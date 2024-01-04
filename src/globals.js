/* 
  These are accessed by content.js and sidebar.js
*/

// Global variables (brave singletons)
var dictionary = {};
var dictionaryLookupTable = {};
const popupId = 'yeFloatingeWindowe';


/** @type {Object<string,Array<MatchedWordEntry[]>>} */
var activeWords = {};
var addedWords = {};

function clearActiveWords() {
  activeWords = {};
}

/**
 * @param {number} lookupIndex a single key to an object in dict.json
 * @param {string} matchedVariant the specific matched variant in lookup.json
 * @param {string} usersSelectedWord the word the user actually tapped (which might not be the same due to fuzzy matching)
*/
class MatchedWordEntry {
  constructor(lookupIndex, matchedVariant, usersSelectedWord) {
    this.lookupIndex = lookupIndex;
    this.matchedVariant = matchedVariant;
    this.usersSelectedWord = usersSelectedWord;
  }
}


/**
 * @brief instances of this class should be stored in a list. Check the list for the `sourcePageEntry.pageURL` corresponding to the current page of interest and handle thereafter as required.
 * @param {string} pageURL should be stripped of parameters
 * @param {string} pageName name of the webpage
 * @param {string} favicon address of which
 * @param {Array.<MatchedWordEntry>} words which the user has added to their list from this page
 */
class sourcePageEntry {
  constructor(pageURL, pageName, favicon, words) {
    this.pageURL;
    this.pageName;
    this.favicon;
    this.words;
  }
}