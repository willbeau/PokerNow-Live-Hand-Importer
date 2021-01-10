var multiplier = 1;

console.log('Poker Now Hand Grabber Running!');

startHandImporter();

var smallBlind;

var bigBlind;

var log_button;

function startHandImporter(){
  let blinds = document.getElementsByClassName('blind-value');
  if (blinds.length) {
    //game loaded, we can run program now
    winObserver = createWinObserver();

    updateBlinds();

    //call log button clicked upon clicking log
    log_button = document.getElementsByClassName("button-1 show-log-button small-button dark-gray")[0];
    log_button.addEventListener("click", logButtonClicked, false);

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

const ProcessHand = (log) => {
  if(log.length != 0){

    let hand = new Hand();
    hand.log = log;
    hand.multiplier = multiplier;
    hand.tableID = getTableID();
    hand.heroName = getHeroName();
    hand.convertToPokerStarsFormat();
    if(firstHand == -1){
      firstHand = hand.handNumber; 
    }
    count++;
    console.log(count + " / " + firstHand);
  }
  
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
  if (!log.includes("ending hand") || !log.includes("starting hand") || !log.includes("(No Limit Texas Hold'em)")) {
    return;
  }
  return log;
}

//updates the blind values
const updateBlinds = () => {
  let blinds = document.getElementsByClassName('blind-value')[0].innerText;
  bigBlind = parseFloat(blinds.substring(blinds.indexOf('/') + 2));
  smallBlind = parseFloat(blinds.substring(blinds.indexOf('~') + 2,blinds.indexOf('/')));
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
                          newHand();
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