/*
  misc & in development functions
*/


async function setCurrentlySelectedTextInLocalStorage() {
  const selection = document.getSelection().toString().toLowerCase();
  await browser.storage.local.set({currentlySelectedText: selection}); 
}

/// TODO: doing new shit here
async function addWordToLocalUserList(word) {
  const currentState = await browser.storage.local.get("userWordList");
  const currentWordsList = currentState.userWordList;
  const hasCommonIndex = currentWordsList.some((e) => e.lookupIndex === word.lookupIndex && e.url === word.url);
  if (hasCommonIndex) return;

  console.log("_______\n word")
  console.log(word)

  console.log("function: currentWordsList:");
  console.log(currentWordsList);

  console.log("state: userWordList:");
  console.log(currentState.userWordList);

  await new Promise((resolve) => {
    console.log("Inside the promise");
    currentWordsList.push(word);
    browser.storage.local.set({ "userWordList": currentWordsList }, resolve);
  });

  console.log("pushed to storage");

  await getState()

  // addPageToUserPagesList();
  // updateSidebar();
}

async function getState(){
  const newState = await browser.storage.local.get();
  const newList = newState.userWordList;
  console.log(newList);
}


/**
 * @param {MatchedWordEntry} word
 */
function addWordToUserList(word) {
  const hasCommonIndex = userAddedWords.some((e) => e.lookupIndex === word.lookupIndex && e.url === word.url);
  if (hasCommonIndex) return; 
  
  userAddedWords.push(word);
  addPageToUserPagesList();
  updateSidebar();
  // console.log("addWordToUserList : added word: " + word.matchedVariant + " id: " + word.lookupIndex);
}


function addPageToUserPagesList() {
  const url = extractBaseURLOfPage();
  const urlExists = userPages.hasOwnProperty(url);
  if (!urlExists) { 
    userPages[url] = buildPageInfo();
  }
  // console.log(userPages[url].pageName);
}


/**
 * @returns {PageInfo} 
 */
function buildPageInfo() {
  const pageTitle = document.title;
  const faviconUrl = document.querySelector('link[rel="shortcut icon"]')?.href || document.querySelector('link[rel="icon"]')?.href || 'https://www.google.com/s2/favicons?domain=' + window.location.hostname;

  const pageEntry = new PageInfo(pageTitle, faviconUrl);
  return pageEntry;
}


function extractBaseURLOfPage() {
  const currentUrl = window.location.href;
  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.hostname}${urlObject.pathname}`;
  // console.log('Base URL:', baseUrl);
  return baseUrl;
}


function htmlize(entry) {
  const boldRegex = /#([^#]+)#/g;
  const replacedHashtags = entry.replace(boldRegex, (match, p1) => `<b>${p1}</b>`);  
  const italicRegex = /_([^_]+)_/g;
  const replacedUnderscores = replacedHashtags.replace(italicRegex, (match, p1) => `<i>${p1}</i>`);

  return replacedUnderscores;
}


/*
    ,-----------.
   (_\           \
      |           |
      |           |
      |  js bad   |
      |           |
     _|           |
    (_/_____(*)___/
             \\
              ))
              ^ 
*/
const areSetsEqual = (a, b) =>
  a.size === b.size && [...a].every((value) => b.has(value));
