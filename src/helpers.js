/*
  misc & in development functions
*/


async function setCurrentlySelectedTextInLocalStorage() {
  const selection = document.getSelection().toString().toLowerCase();
  await browser.storage.local.set({currentlySelectedText: selection}); 
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
