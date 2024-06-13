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

    if (Object.keys(activeWords).length === 0) {
      hideModal();
    } else {
      let printouts = {};
      Object.entries(activeWords).forEach(([key, word]) => printouts[key] = new_dictionaryEntriesToHTMLtext(word, "modal", null));

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


function new_dictionaryEntriesToHTMLtext(entries, mode, pageData) {
  if (entries == null || entries == undefined) return;

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

    const wordHeaderElem = document.createElement('p');
    wordHeaderElem.className = "wordData";
    
    const urlElem = document.createElement('a');
    urlElem.style.fontWeight = "bold";
    urlElem.textContent = entry.usersSelectedWord;
    urlElem.src = `https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=${entry.usersSelectedWord}`;
    wordHeaderElem.appendChild(urlElem);

    if (dictEntry.partOfSpeech != null) {
      const speechPartElem = document.createElement('p');
      speechPartElem.textContent = `${dictEntry.partOfSpeech}`;
      wordHeaderElem.appendChild(speechPartElem);
    }
    
    const addWordBtn = document.createElement('button');
    const lookupID = entry.lookupIndex;
    addWordBtn.class = 'modalButton';
    addWordBtn.id = `${MODAL_ADDWORD_BUTTON_ID_PREFIX}${lookupID}`;
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
    let entryText = "";
    entryElem.innerHTML = `${dictEntry.entry == null ? "" : htmlize(dictEntry.entry)}`; // GOHEREBRO


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
 * This franken-function receives a list of userWordListEntry class objects and uses their index value to get info from the dictionary, and returns it as formatted text.
 * @param {Array.<MatchedWordEntry>} entries
 * @param {string} mode either "modal" or "sidebar"
 * @param {PageInfo} pageData to be used with "sidebar" `mode`. Get extra pre-stored info about the page user is presently on
 * @returns {string} HTML text ready to be passed into a modal/sidebar HTML element constructor, or `null` if there are no entries to parse.
 */
function dictionaryEntriesToHTMLtext(entries, mode, pageData) {
  if (entries == null || entries == undefined) return;
  
  let marginaliaShown = false;
  let text = "";
  
  // header text for modal
  if (entries.length > 1  &&  mode != "sidebar") text += `<p class="textHeader">` + plaintextToFraktur("Possible Matches")+"</p>"; 

  if (pageData != null  &&  mode == "sidebar") { // header text for sidebar
    text += `<button id="${SIDEBAR_CLOSE_BUTTON_ID}"></button><br>`;
    text += `<p class="textHeader">` + plaintextToFraktur(pageData.pageName) + "</p><br>";
  }

  // build word info data for each entry
  for (const [index, entry] of entries.entries()) {
    const dictEntry = dictionary[entry.lookupIndex];
    
    const url = "https://quod.lib.umich.edu/m/middle-english-dictionary/dictionary?utf8=✓&search_field=anywhere&q=" + entry.usersSelectedWord;
  text += '<p class="wordData"><a style="font-weight:bold !important;" href="' + url + '" target="_blank" rel="noopener">' + entry.usersSelectedWord + '</a>';


    if (dictEntry.partOfSpeech != null) text += ": " + dictEntry.partOfSpeech;

    if (mode != "sidebar") {
      const id = entry.lookupIndex; // must assign this to a const var first
      text += ` <button id="${MODAL_ADDWORD_BUTTON_ID_PREFIX}${id}" class="modalButton"></button> `;
    }
    text += "</p>";

    if (dictEntry.variants != null) text += "<p class='wordData'>Variants: " + dictEntry.variants.join(", ") + "</p>";
    if (dictEntry.entry != null) text += "<p class='wordData'>" + htmlize(dictEntry.entry) + "</p>";

    // This will display a single, randomised marginalia in any modal with >3 entries, in the middle of the entries.
    // Around 20% of lookup words have > 1 indexes; ~5% have > 2. 
    if ((mode == "modal")
    &&  (marginaliaShown == false)
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2))) {
      let fullURL = browser.runtime.getURL(getRandomImagePath());
      if (fullURL) {
        text += `<img src="${fullURL}" style="width:80%;display:block; margin: 0 auto;">`;
        marginaliaShown = true;
      }
    }

    // Same as for modal, but then that marginalia will be persistent for that page's sidebar for that session.
    if ((mode == "sidebar") 
    &&  (entries.length > 2) 
    &&  (index+1 == Math.round(entries.length / 2)  )) {
      if (persistentSideBarMarginaliaURL == null) persistentSideBarMarginaliaURL = browser.runtime.getURL(getRandomImagePath());
      text += `<img src="${persistentSideBarMarginaliaURL}" style="width:95%;display:block; margin: 0 auto;">`;
    }
    
    text += "<p class='wordData' style='padding-bottom:15px !important'>_____</p>";
  }

  return text;
}




