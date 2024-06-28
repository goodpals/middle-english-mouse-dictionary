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

Once HTML is injected into the browser window from a content domain script, it exists within a different scope. So, if you create an HTML button with a function `doThing()` assigned to it, and doThing() is defined in a content domain script, the button in the user's browser no longer has access to that function, and pressing it will produce a reference error.
*/


/**
 * @summary The Action Button is the Extension button in the browser toolbar, stored within the Firefox "puzzle" icon menu if not pinned to the toolbar by the user. Clicking it, for this extension, soft-disables the functionality. This listener clears all elements and their listeners from the window. This is done for every window.
 */
! async function listenForUserPressingActionButton() {
  browser.runtime.onMessage.addListener((message) => {
    console.log("MEMD State", message);
    if (message.from != "MEMD" || message.state === 'on') return;

    let modal = findModal();
    if (modal) {
      deleteListenersForModalButtons();
      removeListenersForTabButtons();
      modal.remove();
    }

    if (sidebarExists()) removeSidebar();
  });
}();



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
    const currentState = await browser.storage.local.get();
    if (currentState.onOffState != 'on') return;

    deleteListenersForModalButtons();    
    
    const selection = document.getSelection();
    const hasChanged = processSelection(selection.toString().toLowerCase());
    if (!hasChanged) return;

    if (Object.keys(activeWords).length === 0) {
      hideModal();
    } else {
      let printouts = {};
      Object.entries(activeWords).forEach(([key, word]) => printouts[key] = dictionaryEntriesToHTMLtext(word, "modal", null));

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect(); 
      createOrUpdateModal(event, printouts, Object.keys(activeWords)[0], rect);

      const allMatchedWordEntries = Object.values(activeWords).flatMap(entries => entries);
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



function dictionaryEntriesToHTMLtext(entries, mode, pageData) {
  if (entries == null || entries == undefined) return;
  if (['sidebar', 'modal'].includes(mode) == false) return;

  let marginaliaShown = false;
  let textCont = document.createElement('div');

  // set up header
  const header = document.createElement('p');
  header.className = 'textHeader';
  
  let headerText = document.createElement('p');

  if (entries.length > 1  &&  mode != "sidebar") {
    headerText.textContent = plaintextToFraktur("Possible Matches");
  }
  if (pageData != null && mode == "sidebar") {
    const btn = document.createElement('button');
    btn.className = 'wordListSidebarButton'; // you have to use a custom class because JS can smd
    btn.id = SIDEBAR_CLOSE_BUTTON_ID;
    textCont.appendChild(btn);
    headerText.textContent = plaintextToFraktur(pageData.pageName);
  }

  header.appendChild(headerText);
  textCont.appendChild(header);

  // build word info content for each word, as an HTML element
  for (const [index, entry] of entries.entries()) {
    const dictEntry = dictionary[entry.lookupIndex];

    const wordHeaderElem = document.createElement('div'); // Use a <div> instead of <p> for flexible layout
    wordHeaderElem.className = "wordData";
    wordHeaderElem.style.whiteSpace = "nowrap"; // Ensure elements stay in a single line if they exceed width
    wordHeaderElem.style.display = "flex"; // Use flexbox for layout
    wordHeaderElem.style.alignItems = "center"; // Center align items vertically

    const urlElem = document.createElement('a'); // MAKE ENTRY WORD CLICKABLE URL 
    urlElem.style.fontWeight = "bold";
    urlElem.textContent = entry.usersSelectedWord;
    urlElem.style.marginRight = "5px";
    urlElem.href = `https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=${entry.usersSelectedWord}`;
    wordHeaderElem.appendChild(urlElem);

    if (dictEntry.partOfSpeech != null) {
      const speechPartElem = document.createElement('span'); // <span> instead of <p> for inline elements
      speechPartElem.textContent = `${dictEntry.partOfSpeech}`;
      speechPartElem.style.marginRight = "5px";
      speechPartElem.style.display = "inline-block"; // inline-block allows width and height settings
      wordHeaderElem.appendChild(speechPartElem);
    }

    const addWordBtn = document.createElement('button'); // ADD WORDLIST ADDER BUTTON TO HEADER
    const lookupID = entry.lookupIndex;
    addWordBtn.className = 'modalButton';
    addWordBtn.id = `${MODAL_ADDWORD_BUTTON_ID_PREFIX}${lookupID}`;
    addWordBtn.style.display = "inline-block"; // Display as inline-block to allow width and height settings
    wordHeaderElem.appendChild(addWordBtn);

    // New <p> -- add variant spellings
    const variantsElem = document.createElement('p');
    variantsElem.className = 'wordData';
    let variantsText = "";
    if (dictEntry.variants != null) {
      variantsText = `Variants: ${dictEntry.variants.join(", ")}`;
    }
    variantsElem.textContent = variantsText;

    const entryElem = document.createElement('p');
    entryElem.className = 'wordData';
    if (dictEntry.entry != null) appendHtmlizedText(entryElem, dictEntry.entry);

    const marginaliaElem = document.createElement('img');
    marginaliaElem.className = "marginalia";
    let src = "";
    if ((mode == "modal") 
    &&  (marginaliaShown == false)
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2))) {
      const fullURL = browser.runtime.getURL(getRandomImagePath());
      if (fullURL) {
        src = fullURL;
        marginaliaShown = true;
      }
    } 
    if ((mode == "sidebar") 
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2)  )) {
      if (persistentSideBarMarginaliaURL == null) {
        persistentSideBarMarginaliaURL = browser.runtime.getURL(getRandomImagePath());
      }
      src = persistentSideBarMarginaliaURL;
    }
    marginaliaElem.src = src;

    const dividerElem = document.createElement('p');
    dividerElem.className = "wordData";
    dividerElem.textContent = "_____";
    dividerElem.style.paddingBottom = "10px";

    // combine it all
    textCont.appendChild(wordHeaderElem);
    textCont.appendChild(variantsElem);
    textCont.appendChild(entryElem);
    textCont.appendChild(marginaliaElem);
    textCont.appendChild(dividerElem);
  }

  return textCont;
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