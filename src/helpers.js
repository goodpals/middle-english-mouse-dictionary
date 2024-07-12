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



/**
 * @param {MatchedWordEntry} word 
 */
async function removeWordFromLocalUserList(word) {
  const context = "removeWordFromLocalUserList";
  const currentState = await getStateFromStorage(context, "userWordList");
  if (currentState == undefined) logError(context, "current state is undefined");
  const currentWordsList = currentState.userWordList;
  const hasCommonIndex = currentWordsList.some((e) => e.lookupIndex === word.lookupIndex && e.url === word.url);
  if (!hasCommonIndex) return;

  // console.log("____START____")
  // console.log(word.lookupIndex);
  // console.log(currentWordsList);

  const newWordsList = currentWordsList.filter(e => e.lookupIndex !== word.lookupIndex);

  // console.log("removed. new Arr:")
  // console.log(newWordsList)

  try {
    await browser.storage.local.set({ "userWordList": newWordsList });
  } catch (error) {
    logError(context, error);
    return;
  }
  
  updateSidebar();
  // console.log("____END____")

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


/**
 * @summary Ensure the DOM is ready before appending
 */
function promiseNextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve)); 
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


