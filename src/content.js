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
 *  3. Set the selected text in local storage
 *  4. get the current selected text and check whether it is the same as before. 
 *  5. If it is, a new modal will be created with new listeners.
 */
! async function listenForTextSelection() {
  document.addEventListener("selectionchange", async function(event) {    
    deleteListenersForModalButtons();    
    
    const selection = document.getSelection();
    const hasChanged = processSelection(selection.toString().toLowerCase());
    if (!hasChanged) return;

    if (Object.keys(selectedWordsInDOM).length === 0) {
      hideModal();
    } else {
      const context = "listenForTextSelection";
      const currentState = await getStateFromStorage(context, "userWordList");
      if (currentState == undefined) logError(context, "current state is undefined");
      const currentWordsList = currentState.userWordList;

      let printouts = {};
      const allMatchedWordEntries = Object.values(selectedWordsInDOM).flatMap(entries => entries);
      Object.entries(selectedWordsInDOM).forEach(([key, word]) => printouts[key] = dictionaryEntriesToHTML_modal(word, currentWordsList));

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect(); 
      createOrUpdateModal(event, printouts, Object.keys(selectedWordsInDOM)[0], rect);

      // const allMatchedWordEntries = Object.values(selectedWordsInDOM).flatMap(entries => entries);
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

  // logError('', ''); // for debug -- testing logError

  /** @type {Set<string>} */
  const prev = new Set(Object.keys(selectedWordsInDOM));
  const sel = new Set(selection.split(" "));
  
  const newWords = new Set([...sel].filter(x => !prev.has(x)));
  const oldWords = new Set([...prev].filter(x => !sel.has(x)));
  
  for (const word of oldWords) {
    delete selectedWordsInDOM[word];
  }
  for (const word of newWords) {
    const found = searchDictionary(word);
    if (found != null) {
      selectedWordsInDOM[word] = found;
    }
  }
  const updated = new Set(Object.keys(selectedWordsInDOM));
  // console.log("Active words: " + Object.keys(selectedWordsInDOM).join(', '));
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
 * Parses a string and appends the appropriate text and HTML elements to the parent element.
 * @param {Element} parentElement - The parent element to append to.
 * @param {string} entry - The entry string to parse and append.
 */
function appendHtmlizedText(parentElement, entry) {
  const boldRegex = /#([^#]+)#/g;
  const italicRegex = /_([^_]+)_/g;

  // A DIGITAL SCAN OF THE SOURCE BOOK, HOSTED ON ARCHIVE.ORG
  const archiveLink_root = 'https://archive.org/details/sisamfourteenthcenturyverse/page/n';
  const archiveLink_mode = '/mode/1up';
  const pageAlignNum = 51; // the offset number of pages for each chapter number
  const numeralCodes = new Map([
    ['I', 1], // page numbers
    ['II', 13],
    ['III', 32],
    ['IV', 36],
    ['V', 44],
    ['VI', 57],
    ['VII', 68],
    ['VIII', 76],
    ['IX', 94],
    ['X', 107],
    ['XI', 115],
    ['XII', 129],
    ['XIII', 145],
    ['XIV', 151],
    ['XV', 162],
    ['XVI', 171],
    ['XVII', 185],
  ]);


  const fragments = [];

  // First, replace bold text
  let lastIndex = 0;
  entry.replace(boldRegex, (match, p1, offset) => {
    if (offset > lastIndex) {
      fragments.push({ type: 'text', content: entry.slice(lastIndex, offset) });
    }
    fragments.push({ type: 'bold', content: p1 });
    lastIndex = offset + match.length;
  });

  if (lastIndex < entry.length) {
    fragments.push({ type: 'text', content: entry.slice(lastIndex) });
  }

  // now parse italics out
  const processedFragments = [];
  fragments.forEach(fragment => {
    if (fragment.type === 'text') {
      let text = fragment.content;
      let lastItalicIndex = 0;
      text.replace(italicRegex, (match, p1, offset) => {
        if (offset > lastItalicIndex) {
          processedFragments.push({ type: 'text', content: text.slice(lastItalicIndex, offset) });
        }
        processedFragments.push({ type: 'italic', content: p1 });
        lastItalicIndex = offset + match.length;
      });
      if (lastItalicIndex < text.length) {
        processedFragments.push({ type: 'text', content: text.slice(lastItalicIndex) });
      }
    } else {
      processedFragments.push(fragment);
    }
  });

  // now build in links into roman numerals
  processedFragments.forEach(fragment => {
    if (fragment.type === 'text') {
      let text = fragment.content;
      const romanNumeralKeys = Array.from(numeralCodes.keys());

      // Process each word in the text
      text.split(/(\s+)/).forEach(word => {
        const cleanWord = word.replace(/^\(|\)$/, ''); // Remove parentheses from the left and right if present
        if (romanNumeralKeys.includes(cleanWord)) {
          const pageNumber = pageAlignNum + numeralCodes.get(cleanWord);
          const anchorElem = document.createElement('a');
          anchorElem.href = `${archiveLink_root}${pageNumber}${archiveLink_mode}`;
          anchorElem.textContent = word; // Retain the original word with parentheses
          parentElement.appendChild(anchorElem);
        } else {
          parentElement.appendChild(document.createTextNode(word));
        }
      });
    } else if (fragment.type === 'bold') {
      const boldElem = document.createElement('b');
      boldElem.textContent = fragment.content;
      parentElement.appendChild(boldElem);
    } else if (fragment.type === 'italic') {
      const italicElem = document.createElement('i');
      italicElem.textContent = fragment.content;
      parentElement.appendChild(italicElem);
    }
  });
}



function findAndReplaceNumerals(str) {
  let result = str;
  numeralCodes.forEach((value, key) => {
      const findRx = new RegExp(`(?:, |> )${key}\\b`, 'g'); // looks for numerals preceded by the edge of a tag, or a comma
      const replaceRx = new RegExp(`\\b${key}\\b`, 'g'); // just parses the roman numeral pattern
      const matches = result.match(findRx);
      if (!matches) return; // effectively a `continue;`
      const linkifiedNumerals = buildLink(key, value);
      const replacedStr = result.replace(replaceRx, linkifiedNumerals);
      if (replacedStr !== result) result = replacedStr;
  });
  return result;
}