/*
  misc & in development functions
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
  if (hasCommonIndex == true) return; /// selected word is already in dict

  for (entry of thisWordInfo) {
    userWords.push(entry);
  }
  await browser.storage.local.set({userWordList: userWords});
  /// Now, when the user opens the UWL side panel from their right-click contextMenu, the updated list will display.
}


async function setCurrentlySelectedTextInLocalStorage() {
  // TODO: chat about refactoring this/other globals IRT: we need to access data from background.js in order to open website query link. Alternative is cursed messagesending shit
  const selection = document.getSelection().toString().toLowerCase();
  await browser.storage.local.set({currentlySelectedText: selection}); 
}


function htmlize(entry) {
  const boldRegex = /#([^#]+)#/g;
  const replacedHashtags = entry.replace(boldRegex, (match, p1) => `<b>${p1}</b>`);  
  const italicRegex = /_([^_]+)_/g;
  const replacedUnderscores = replacedHashtags.replace(italicRegex, (match, p1) => `<i>${p1}</i>`);

  return replacedUnderscores;
}


/**
 * @returns {HTMLElement | null}
 */
function findPopup() {
  return document.getElementById(popupId);
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
