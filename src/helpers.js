/*
  gJYp Q  .gp    Q.gp
 ' $ I.aF""Tb..aF"""Tbp
   $=I"     Y!"Y     'Y!. 
   $ I       $ I      $ I
   $ I       $ I      $ I
   $ I       $ I      $ I
  !$!I      !$!I      $ I
  !$!I      !$!I      !$!
 .J^RpjF  ^J^RpjF"   ^$$$miscellaneous helper & multi-file-dependent functions
*/



async function setCurrentlySelectedTextInLocalStorage() {
  const selection = document.getSelection().toString().toLowerCase();
  try{
    await browser.storage.local.set({currentlySelectedText: selection});
  } catch (error) {
    logError("setCurrentlySelectedTextInLocalStorage", error);
  }
}


/**
 * @param {string} context user-defined string; the name of the function or scope of invocation
 * @param {string} param the key of the specific local storage object
 * @returns {Object|null|undefined} an object containing the field specified by `param`. If managed storage is not set, undefined will be returned. If you pass null, or an undefined value, the entire storage contents will be retrieved.
 */
async function getStateFromStorage(context, param) {
  try {
    const currentState = await browser.storage.local.get(param);
    if (stateError(context, currentState)) {
      logError(context, `Error retrieving ${param} from storage: managed storage is not set.`);
    }
    return currentState;
  } catch (error) {
    logError(context, `Error retrieving ${param} from storage: ${error}.`);
    return undefined;
  }
}


/**
 * @param {string} context user-defined string; the name of the function or scope of invocation
 * @param {string} param the key of the specific local storage object
 * @returns {bool}
 */
function stateError(context, state) {
  if (state === undefined || state === null) {
    logError(context, `state is: ${state}`);
    return true;
  }
  return false;
}


/**
 * @returns {PageInfo} custom user class
 */
function buildPageInfo() {
  const pageTitle = document.title;
  const faviconUrl = document.querySelector('link[rel="shortcut icon"]')?.href || document.querySelector('link[rel="icon"]')?.href || 'https://www.google.com/s2/favicons?domain=' + window.location.hostname;

  const pageEntry = new PageInfo(pageTitle, faviconUrl, false);
  return pageEntry;
}


/**
 * @returns a parsed URL
 */
function extractBaseURLOfPage() {
  const currentUrl = window.location.href;
  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.hostname}${urlObject.pathname}`;
  return baseUrl;
}


/**
 * @param {string} an entry from the dictionary 
 * @returns that entry with replaced symbols 
 */
function htmlize(entry) {
  const boldRegex = /#([^#]+)#/g;
  const replacedHashtags = entry.replace(boldRegex, (match, p1) => `<b>${p1}</b>`);  
  const italicRegex = /_([^_]+)_/g;
  const replacedUnderscores = replacedHashtags.replace(italicRegex, (match, p1) => `<i>${p1}</i>`);
  return replacedUnderscores;
}


async function addWordToLocalUserList(word) {
  const context = "addWordToLocalUserList";
  const currentState = await getStateFromStorage(context, "userWordList");
  if (currentState == undefined) logError(context, "current state is undefined");
  const currentWordsList = currentState.userWordList;
  const hasCommonIndex = currentWordsList.some((e) => e.lookupIndex === word.lookupIndex && e.url === word.url);
  if (hasCommonIndex) return;

  currentWordsList.push(word);
  
  try {
    await browser.storage.local.set({ "userWordList": currentWordsList });
  } catch (error) {
    logError(context, error);
    return;
  }

  addPageToLocalUserPagesList();
  updateSidebar();
}


async function addPageToLocalUserPagesList() {
  const context = "addPageToLocalUserPagesList";
  const currentState = await getStateFromStorage(context, "userPagesList");
  if (currentState == undefined) logError(context, "current state is undefined");
  const currentPagesList = currentState.userPagesList;
  const url = extractBaseURLOfPage();

  const urlAlreadyLogged = currentPagesList.hasOwnProperty(url);
  if (urlAlreadyLogged) return; 

  currentPagesList[url] = buildPageInfo();

  try {
    await browser.storage.local.set({ "userPagesList": currentPagesList });
  } catch (error) {
    logError(context, error);
    return;
  }
  // await printState('userPagesList');
}


async function printState(state){
  const context = "printState";
  const newState = await getStateFromStorage(context, ['userWordList', 'userPagesList']);
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



function logError(context, error) {
  console.error("MEMD: " + context + ": " + error);
}
  