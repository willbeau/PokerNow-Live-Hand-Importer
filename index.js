const NEW_HAND_TIMEOUT = 10 * 1000; //10 seconds

var multiplier = 1;

console.log('Poker Now Hand Grabber Running!');
startHandImporter();

var smallBlind;
var bigBlind;

var gameType = "";

//stop two files saving at a time for chopped pots
var d = new Date();
var previousTime = d.getTime() - 500;

function startHandImporter(){
  let blinds = document.getElementsByClassName('blind-value');
  if (blinds.length) {
    addImportFullLogButton();
    //game loaded, we can run program now
    winObserver = createWinObserver();

    updateBlinds();
    ProcessLastHand(); //TESTING PURPOSES
  } else {
    setTimeout(startHandImporter, 350); // try again in 350 milliseconds
  }
}

const newHand = () => {
    ProcessLastHand();
    updateBlinds();
}

//Fetches and converts last hand to pokerstars format
const ProcessLastHand = async() => {
  disableDownloadShelf();
  d = new Date();
  let currentTime = d.getTime();

  if(currentTime - previousTime > 100){
    previousTime = currentTime;
    setTimeout(async function(){
      let log = await fetchLastLog();
      let hand = new Hand();
      hand.rawLog = log;
      hand.smallBlind = smallBlind;
      hand.bigBlind = bigBlind;
      hand.multiplier = multiplier;
      hand.tableID = getTableID();
      hand.heroName =getHeroName();
      hand.givenBlinds = true;
      hand.gameType = gameType;
      hand.convertToPokerStarsFormat();
      
      setTimeout(enableDownloadShelf(), 1000);
    },500);
  }
  
}

let firstHand = -1;
let count = 0;

async function ProcessHand(log) {
  if(log.length != 0){

    let hand = new Hand();
    hand.rawLog = log;
    hand.multiplier = multiplier;
    hand.tableID = getTableID();
    hand.heroName = getHeroName();
    hand.gameType = gameType;
    hand.convertToPokerStarsFormat();
    if(firstHand == -1){
      firstHand = hand.handNumber; 
    }
    count++;
    console.log(count + " / " + firstHand);
    return hand;
  }
  return;
}

let maxButtonAddAttempts = 5;
let buttonAddAttempts = 0;
// Add a button to the log/ledger menu that enables players to process the full log 
const addImportFullLogButton = async () => {

  logBtn = document.querySelector("#canvas > div.game-column > div.game-main-container.four-color > div.aux-chat-bottom-buttons-ctn > div > button");
  logBtn.addEventListener('click',function() {
    buttonAddAttempts = 0;
    createImportFullLogButton();
  });
}

// Keeps trying to create the full log button

function createImportFullLogButton() {
  var originalButton = document.querySelector('#canvas > div.game-column > div.game-main-container.four-color > div.modal-overlay > div > div.modal-body > div.log-modal-controls > button.button-1.green-2.small-button.highlighted.full-log-button');
  if (originalButton) {
      var newButton = originalButton.cloneNode(true);
      newButton.textContent = 'Process Full Log';
      // Remove old event listeners
      newButton.replaceWith(newButton.cloneNode(true));

      newButton.addEventListener('click', processFullLog);

      // Place button
      originalButton.parentNode.insertBefore(newButton, originalButton.nextSibling);
  } else {
    if (buttonAddAttempts < maxButtonAddAttempts) {
      buttonAddAttempts++;
      setTimeout(createImportFullLogButton, 350);
  } else {
      console.log("Max attempts reached, stopping retries.");
  }
  }
}

// Recursively Processess full log.
const processFullLog = async () => {
  firstHand = -1;
  count = 0;
  console.log("Processing full log!");
  const sessionUrl = window.location.href;
  
  let beforeAt = '';  // Start with the most recent logs
  let continueFetching = true;
  
  // Keep fetching until we hit hand #1
  while(continueFetching) {
    let url = `${sessionUrl}/log?after_at=&before_at=${beforeAt}`;
    let data = await fetch(url).then(res => res.text());
    let prevBeforeAt = beforeAt;
    while(true) {
      let startP = data.indexOf("-- ending hand #", 1);
      startP = data.lastIndexOf("{", startP);
      let endP = data.indexOf("-- starting hand #", startP);
      endP = data.indexOf("}", endP);

      if(startP < 0 || endP < 0) {
        break;
      }

      let log = data.substring(startP, endP);
      data = data.substring(endP);
      if (!log.includes("ending hand") || !log.includes("starting hand")){
        break;
      }

      let hand = await ProcessHand(log);
      if(hand.handNumber == 1) {
        continueFetching = false;
      }
      if(hand.mstime < beforeAt || beforeAt == '') {
        beforeAt = hand.mstime;
      }
      
    }
    await delay(3000); // Wait before processing next batch

    if(prevBeforeAt == beforeAt) {
      continueFetching = false;
    }
  }
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Fetches previous hand from log url
const fetchLastLog = async () => {
  const sessionUrl = window.location.href;

  const url = `${sessionUrl}/log?after_at=&before_at=`

  const data = await fetch(url).then(res => res.text())
  
  let startP = data.indexOf("-- ending hand #", 1);

  startP = data.lastIndexOf("{", startP);

  let endP = data.indexOf("-- starting hand #", startP);

  endP = data.indexOf("}", endP);

  let log = data.substring(startP, endP);

  if (!log.includes("ending hand") || !log.includes("starting hand")){
    return;
  }
  return log;
}

//updates the blind values and game type
const updateBlinds = () => {
  let blinds = document.getElementsByClassName('blind-value')[0].innerText;

  bigBlind = parseFloat(blinds.substring(blinds.indexOf('/') + 2));

  smallBlind = parseFloat(blinds.substring(blinds.indexOf('~') + 2,blinds.indexOf('/')));

  gameType = document.getElementsByClassName('table-game-type')[0].innerText || "";

  setTableName(getTableID(), `${smallBlind}/${bigBlind}`, gameType);
}

//returns table id
function getTableID() {

  let url = window.location.href;

  let startP = url.lastIndexOf("/") + 1;

  return url.substring(startP, url.length);

}

//Converts a string with letters and numbers into just numbers
function convertToNumber(str) {
  var anum = {
      a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10, k: 11,
      l: 12, m: 13, n: 14, o: 15, p: 16, q: 17, r: 18, s: 19, t: 20,
      u: 21, v: 22, w: 23, x: 24, y: 25, z: 26,
      A: 27, B: 28, C: 29, D: 30, E: 31, F: 32, G: 33, H: 34, I: 35, J: 36, K: 37,
      L: 38, M: 39, N: 40, O: 41, P: 42, Q: 43, R: 44, S: 45, T: 46,
      U: 47, V: 48, W: 49, X: 50, Y: 51, Z: 52, '0' :'0', '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  }
  if (str.length == 1) return anum[str] || '';

  return str.split('').map(convertToNumber);
}


//Save any text to downloads file
const saveText = (saveText, saveLocation) => {
  chrome.runtime.sendMessage({method: "saveText", text: saveText, location: saveLocation });
  disableDownloadShelf();
}

const disableDownloadShelf = () => {
  chrome.runtime.sendMessage({method: "disableDownloadShelf"});
}

const enableDownloadShelf = () => {
  chrome.runtime.sendMessage({method: "enableDownloadShelf"});
}


//observes the entire table to look for chips being added to a players stack to process the hand
const createWinObserver = () => {
  var mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
          mutation.addedNodes.forEach(
              function (node) {
                  if (typeof node.className != 'undefined') {
                      if (node.className.includes("table-player-stack-prize")) {
                          setTimeout(newHand(), NEW_HAND_TIMEOUT);
                      }
                  }
              }

          );
      });

  });
  let seats = document.getElementsByClassName("seats")[0];
  mutationObserver.observe(seats, {
      childList: true,
      subtree: true,
      attributes: true,
  });
  return mutationObserver;
}


function fixCards(str){
  return str.replaceAll("♠","s").replaceAll("♥","h").replaceAll("♦","d").replaceAll("♣","c").replaceAll("10","T");
}


function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
 }   

 function getHeroName(){
   for(let i = 0; i <=10; i++){
     let seat = document.getElementsByClassName("table-player table-player-" + i +  " you-player ");
     if(seat.length == 1){
       return(seat[0].getElementsByClassName("table-player-name")[0].innerText);
     }
   }
   return "";
 }
 function setTableName(name, blinds, game) {
  document.title = `${name} - ${blinds} - ${game || ""}`;
}
