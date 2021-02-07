// require('@babel/polyfill');
const _gui = require('./GUI.js');

const logButtonClicked = _gui.logButtonClicked;
const setTableName = _gui.setTableName;

const Hand = require('./Hand.js');

const NEW_HAND_TIMEOUT = 10 * 1000; //10 seconds

var multiplier = 1;

startHandImporter();

var smallBlind;
var bigBlind;

var gameType = "";

var log_button;


function startHandImporter(){
  let blinds = document.getElementsByClassName('blind-value');
  if (blinds.length) {
    //game loaded, we can run program now
    winObserver = createWinObserver();

    updateBlinds();
    ProcessLastHand();
    //call log button clicked upon clicking log
    log_button = document.getElementsByClassName("button-1 show-log-button small-button dark-gray")[0];
    log_button.addEventListener("click", logButtonClicked, false);

    console.log('Poker Now Hand Grabber Running!');
  } else {
    setTimeout(startHandImporter, 350); // try again in 350 milliseconds
  }
}

function newHand() {
    ProcessLastHand();
    updateBlinds();
}

//Fetches and converts last hand to pokerstars format
function ProcessLastHand() {
  disableDownloadShelf();
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
    hand.convertToPokerStarsFormat();
    setTimeout(enableDownloadShelf(), 1000);
  },500);
}

//Fetches previous hand from log url
async function fetchLastLog() {
  const sessionUrl = window.location.href;
  const url = `${sessionUrl}/log?after_at=&before_at=`
  const data = await fetch(url).then(res => res.text())
  let startP = data.indexOf("-- ending hand #", 1);
  startP = data.lastIndexOf("{", startP);

  let endP = data.indexOf("-- starting hand #", startP);
  endP = data.indexOf("}", endP);
  let log = data.substring(startP, endP);
  if (!log.includes("ending hand") || !log.includes("starting hand") || !log.includes("(No Limit Texas Hold'em)")) {
    return;
  }
  return log;
}

//updates the blind values and game type
function updateBlinds() {
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

function disableDownloadShelf() {
  chrome.runtime.sendMessage({method: "disableDownloadShelf"});
}

function enableDownloadShelf() {
  chrome.runtime.sendMessage({method: "enableDownloadShelf"});
}


//observes the entire table to look for chips being added to a players stack to process the hand
function createWinObserver() {
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
   
 function getHeroName(){
   for(let i = 0; i <=10; i++){
     let seat = document.getElementsByClassName("table-player table-player-" + i +  " you-player ");
     if(seat.length == 1){
       return(seat[0].getElementsByClassName("table-player-name")[0].innerText);
     }
   }
   return "";
 }
