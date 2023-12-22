/* 
  These are accessed by content.js and sidebar.js
*/

// Global variables (brave singletons)
var dictionary = {};
var dictionaryLookupTable = {};
const popupId = 'yeFloatingeWindowe';


/** @type {Object<string,Array<MatchedWordEntry[]>>} */
var activeWords = {};

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