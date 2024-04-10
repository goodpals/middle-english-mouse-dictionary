/* 
  Global variables (brave singletons)
  These are accessed by content.js and sidebar.js etc
  Functions tightly associated with these globals such as those which instantiate their base values are also stored here.
*/



// PAGE-SCOPED HTML ELEMENT IDs

const delSidebarButtonId = 'delSidebar'; // this is the X close button on the sidebar

const modalId = 'yeFloatingeWindowe'; // this is the popup of word definitions
const TAB_BTN_ID_PREFIX = '_MEMD_TAB_BTN'; // Different words the user highlights, displayed in the modal
const ADD_BUTTON_ID_PREFIX = '_MEMD_ADD_BTN'; // Button to add to the user list (displayed in the sidebar)

/*  Below is the modal popup, which appears when the user selects text.
    ┌────────┬────────┬────────┬───┐
    │ word 1 │ word 2 │ word 3 │ wo│ <--- These are the tab buttons.
    ├────────┴────────┴────────┴───┤
    │                              │
    │  word: (wordtype) [+]  <----------- This [+] button is the add button.
    │   info about the word        │
    │   info about the word        │
    │                              │
    │  word: (wordtype) [+]        │
    │   info about the word        │
    │   info about the word        │
    └──────────────────────────────┘
*/



// DICTIONARIES

var dictionary = {};
var dictionaryLookupTable = {};

/** 
 * @summary Instantiate content-script specific dictionary variables, extracted from the JSON files in the `data` directory, by functions in  background.js. This is done because the dictionary files cannot be accessed directly by content.js; they must be first instantiated in background.js, and then loaded into content.js specific global variables by means of a local-storage getter function.
 */
! async function loadDict() 
{
  const context = "loadDict";
  try {
    const res = await getStateFromStorage(context, "dictionary");
    if (res) dictionary = res.dictionary;
  } catch (error) {
    logError(`${context}: dictionary`, error);
  }
  
  try {
    const res = await getStateFromStorage(context, "lookup");
    if (res) dictionaryLookupTable = res.lookup;
  } catch (error) {
    logError(`${context}: lookup table`, error);
  }

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
 * @type {Object<string, Array<MatchedWordEntry>>} */
var activeWords = {};

function clearActiveWords() {
  activeWords = {};
}

/**
 * @summary a list of strings containing the IDs of CSS-class `wordInfoTabButton` tab buttons for the modal, formatted as the word of interest prefixed by `_MEMD_TABBUTTON_`. These buttons, when pressed, reveal a tab containing word info, of the CSS class `wordInfoTab`
 * @global 
 * @type {Array<string>} */
let presentTabButtonListeners = []; 

function clearTabButtonListeners() {
  presentTabButtonListeners = [];
}

/** 
 * @summary presentListeners is a list of indexes that correspond to the ids held in buttons appended with event listeners. These buttons appear in the modal (see: modal.js) popup that gives information about a given word the user selects in the browser. Each possible match for the selected word will have a little button next to it, the pressing of which will add the word to `userAddedWords` (see: globals.js). These listener addresses are disposed of when the user selects new text. 
 * @global 
 * @type {Array<int>} */
var presentListeners = [];

function clearPresentListeners() {
  presentListeners = [];
}




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
 * @param {bool} sideBarOpen current state of the sidebar on this page
 * @param {string} favicon address of which
 */
class PageInfo {
  constructor(pageName, favicon, sideBarOpen) {
    this.pageName = pageName;
    this.sideBarOpen = sideBarOpen;
    this.favicon = favicon;
  }
}



// FUNNY FONTS, MARGINALIA IMAGE HANDLING &c.

/**
 * @summary this is altered in content.js -> dictionaryEntriesToHTMLtext() when creating the sidebar. It is instantiated when the user first opens a sidebar, after which it will not be changed
 */
var persistentSideBarMarginaliaURL = null;

const marginaliaFilepaths = [
  "arseface",
  "ashmole",
  "beehives",
  "beehives2",
  "bellows",
  "birdField",
  "bum",
  "catLicker",
  "catMirror",
  "catSnail",
  "deathD",
  "dragonInBed",
  "ducky",
  "greenKnight",
  "hand",
  "hedgy",
  "horsnail",
  "hydra",
  "infectedBottom",
  "ironworker",
  "killerrabbit",
  "kynge",
  "kynge2",
  "mermaidHarp",
  "merman",
  "mixedupman",
  "otter",
  "owlboi",
  "prancingknight",
  "rabbitHorn",
  "rabbitsProcession",
  "salamander",
  "skullbishop",
  "threeFish",
  "toad",
  "unicorn",
  "unicorn2",
  "wolf",
  "winter",
  "wolf"
];

function getRandomImagePath() {
  const randomIndex = Math.floor(Math.random() * marginaliaFilepaths.length);
  const filepath = marginaliaFilepaths[randomIndex];
  return `marginalia/${filepath}.png`;
}


const blackletters = new Map([
  ['A', '𝔄'],
  ['B', '𝔅'],
  ['C', 'ℭ'],
  ['D', '𝔇'],
  ['E', '𝔈'],
  ['F', '𝔉'],
  ['G', '𝔊'],
  ['H', 'ℌ'],
  ['I', 'ℑ'],
  ['J', '𝔍'],
  ['K', '𝔎'],
  ['L', '𝔏'],
  ['M', '𝔐'],
  ['N', '𝔑'],
  ['O', '𝔒'],
  ['P', '𝔓'],
  ['Q', '𝔔'],
  ['R', 'ℜ'],
  ['S', '𝔖'],
  ['T', '𝔗'],
  ['U', '𝔘'],
  ['V', '𝔙'],
  ['W', '𝔚'],
  ['X', '𝔛'],
  ['Y', '𝔜'],
  ['Z', 'ℨ'],
  ['a', '𝔞'],
  ['b', '𝔟'],
  ['c', '𝔠'],
  ['d', '𝔡'],
  ['e', '𝔢'],
  ['f', '𝔣'],
  ['g', '𝔤'],
  ['h', '𝔥'],
  ['i', '𝔦'],
  ['j', '𝔧'],
  ['k', '𝔨'],
  ['l', '𝔩'],
  ['m', '𝔪'],
  ['n', '𝔫'],
  ['o', '𝔬'],
  ['p', '𝔭'],
  ['q', '𝔮'],
  ['r', '𝔯'],
  ['s', '𝔰'],
  ['t', '𝔱'],
  ['u', '𝔲'],
  ['v', '𝔳'],
  ['w', '𝔴'],
  ['x', '𝔵'],
  ['y', '𝔶'],
  ['z', '𝔷']
]);

function plaintextToFraktur(input) {
  return input.split('').map((e) => blackletters.has(e) ? blackletters.get(e) : e).join('');
}