/*
  misc & in development functions
*/


async function setCurrentlySelectedTextInLocalStorage() {
  const selection = document.getSelection().toString().toLowerCase();
  await browser.storage.local.set({currentlySelectedText: selection}); 
}


/**
 * @returns {PageInfo} 
 */
function buildPageInfo() {
  const pageTitle = document.title;
  const faviconUrl = document.querySelector('link[rel="shortcut icon"]')?.href || document.querySelector('link[rel="icon"]')?.href || 'https://www.google.com/s2/favicons?domain=' + window.location.hostname;

  const pageEntry = new PageInfo(pageTitle, faviconUrl, false);
  return pageEntry;
}


function extractBaseURLOfPage() {
  const currentUrl = window.location.href;
  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.hostname}${urlObject.pathname}`;
  return baseUrl;
}


function htmlize(entry) {
  const boldRegex = /#([^#]+)#/g;
  const replacedHashtags = entry.replace(boldRegex, (match, p1) => `<b>${p1}</b>`);  
  const italicRegex = /_([^_]+)_/g;
  const replacedUnderscores = replacedHashtags.replace(italicRegex, (match, p1) => `<i>${p1}</i>`);

  return replacedUnderscores;
}



async function addWordToLocalUserList(word) {
  const currentState = await browser.storage.local.get("userWordList");
  const currentWordsList = currentState.userWordList;
  const hasCommonIndex = currentWordsList.some((e) => e.lookupIndex === word.lookupIndex && e.url === word.url);
  if (hasCommonIndex) return;

  await new Promise((resolve) => {
    currentWordsList.push(word);
    browser.storage.local.set({ "userWordList": currentWordsList }, resolve);
  });
  // await printState('userWordList');

  addPageToLocalUserPagesList();
  updateSidebar();
}



async function addPageToLocalUserPagesList() {
  const currentState = await browser.storage.local.get("userPagesList");
  const currentPagesList = currentState.userPagesList;
  const url = extractBaseURLOfPage();

  const urlAlreadyLogged = currentPagesList.hasOwnProperty(url);
  if (urlAlreadyLogged) return; 

  await new Promise((resolve) => {
    currentPagesList[url] = buildPageInfo();
    browser.storage.local.set({ "userPagesList": currentPagesList }, resolve);
  });
  // await printState('userPagesList');
}



async function printState(state){
  const newState = await browser.storage.local.get(['userWordList', 'userPagesList']);
  if (state === 'userWordList') {
    console.log('userWords');
    const newWordList = newState.userWordList;
    console.log(newWordList);
  }
  if (state === 'userPagesList') {
    console.log('userPages');
    const newPagesList = newState.userPagesList;
    console.log(newPagesList);
  }
  return;
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

