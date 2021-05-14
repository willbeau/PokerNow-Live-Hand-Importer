var browser = require("webextension-polyfill");

var log = [];
var inHand = false;
var firstHand = -1;
var count = 0;

function setTableName(name, blinds, game) {
  document.title = `${name} - ${blinds} - ${game || ""}`;
}

const { Hand, disableDownloadShelf, enableDownloadShelf } = require('./Hand.js');

const NEW_HAND_TIMEOUT = 10 * 1000; //10 seconds

var multiplier = 1;

browser.runtime.sendMessage({method: "makePopup"}).then(
  _ => startHandImporter(),
  error => { console.error(error); }
);

var smallBlind;
var bigBlind;

var gameType = "";

var log_button;

let winObserver;


function startHandImporter(){
  let blinds = document.getElementsByClassName('blind-value');
  if (blinds.length) {
    //game loaded, we can run program now
    winObserver = createWinObserver();

    updateBlinds();
    ProcessLastHand();

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
    hand.gameType = gameType;
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
  if (!log.includes("ending hand") || !log.includes("starting hand")) {
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

//
//  BET MODIFIERS AND RNG
//

let rngEnabled = false;
let customBets = false;

let conf;

try {
  browser.storage.local.get({
      enableRNG: false,
      enableCustomBets: false,
      preflopBB: "2.5,3",
      preflopPCT: "0.5,1",
      flopBB: "",
      flopPCT: "0.5,1",
      turnBB: "",
      turnPCT: "0.5,1",
      riverBB: "",
      riverPCT: "0.5,1"
  }).then(res => {
    rngEnabled = res.enableRNG || false;
    customBets = res.enableCustomBets || false;
    
    conf = {
      preflop: {
        bb:String(res.preflopBB).split(",").filter(e => e!="").map(e => Number(e)),
        pct:String(res.preflopPCT).split(",").filter(e => e!="").map(e => Number(e))
      },
      flop: {
        bb:String(res.flopBB).split(",").filter(e => e!="").map(e => Number(e)),
        pct:String(res.flopPCT).split(",").filter(e => e!="").map(e => Number(e))
      },
      turn: {
        bb:String(res.turnBB).split(",").filter(e => e!="").map(e => Number(e)),
        pct:String(res.turnPCT).split(",").filter(e => e!="").map(e => Number(e))
      },
      river: {
        bb:String(res.riverBB).split(",").filter(e => e!="").map(e => Number(e)),
        pct:String(res.riverPCT).split(",").filter(e => e!="").map(e => Number(e))
      }
    }

    //if both are disabled, dont waste resources
    if (customBets || rngEnabled) {
      function inputBet(bet){
        let input = document.querySelector(".value-input-ctn > .value");
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        ).set.call(input, bet);

        input.dispatchEvent(new Event("input", { bubbles: true }));
      }

      function clearBetButtons(){
      var dbb = document.querySelector(".default-bet-buttons");
      while(dbb.firstChild) { dbb.firstChild.remove(); }
      }

      function addBetButtonBB(size){
      var usingCents = document.querySelector(".slider-control").step != 1;
      var dbb = document.querySelector(".default-bet-buttons");
      var bbsize = document.querySelectorAll(".blind-value > .chips-value")[1].querySelector(".normal-value").innerText;

      var chipSize = size*bbsize;

      if (!usingCents) {
        chipSize = Math.round(chipSize);
      }

      var a = document.createElement("button");
      a.className = "button-1 default-bet-button";
      a.type = "button";
      a.innerText = size + "bb";
      a.onclick=function(){inputBet(chipSize);}
      dbb.appendChild(a);
      }

      function addBetButtonPct(size){
        //Expects size to be a decimal from 0 to 1

        var usingCents = document.querySelector(".slider-control").step != "1";
        var dbb = document.querySelector(".default-bet-buttons");

        let largestBet = 0;
        var pot = document.querySelector(".table-pot-size > .main-value > .chips-value > .normal-value");
        let potSize = pot ? Number(pot.innerHTML) : 0;
        document.querySelectorAll(".table-player-bet-value > .chips-value > .normal-value").forEach(v => {
          potSize += Number(v.innerHTML);
          if (v.innerHTML > largestBet) {
            largestBet = Number(v.innerHTML);
          }
        });

        var yb = document.querySelector(".you-player > .table-player-bet-value > .chips-value > .normal-value");
        let yourBet = yb ? Number(yb.innerHTML) : 0;

        var chipSize = largestBet + (largestBet-yourBet+potSize)*size;

        if (!usingCents) {
          chipSize = Math.round(chipSize);
        }

        var a = document.createElement("button");
        a.className = "button-1 default-bet-button";
        a.type = "button";
        a.innerText = size*100 + "%";
        a.onclick=function(){inputBet(chipSize);}
        dbb.appendChild(a);
      }

      function updateBets(node) {
      clearBetButtons();

      let street = document.querySelector(".table-cards").children.length;

      //Preflop
      if (street == 0) {
        (conf.preflop.bb || []).forEach(b => addBetButtonBB(b));
        (conf.preflop.pct || []).forEach(b => addBetButtonPct(b));
      }

      //Flop
      if (street == 3) {
        (conf.flop.bb || []).forEach(b => addBetButtonBB(b));
        (conf.flop.pct || []).forEach(b => addBetButtonPct(b));
      }

      //Turn
      if (street == 4) {
        (conf.turn.bb || []).forEach(b => addBetButtonBB(b));
        (conf.turn.pct || []).forEach(b => addBetButtonPct(b));
      }

      //River
      if (street == 5) {
        (conf.river.bb || []).forEach(b => addBetButtonBB(b));
        (conf.river.pct || []).forEach(b => addBetButtonPct(b));
      }
      }

      function rollRNG(){
        let roll_n = Math.round(Math.random()*100);
        let gameinf = document.querySelector(".game-infos");

        let a;
        if ((a = gameinf.querySelector(".r-n-g"))) {
          a.innerHTML = roll_n;
        } else {
          a = document.createElement("p");
          a.className = "r-n-g";
          a.innerHTML = roll_n;
          a.style.color = "red";
          gameinf.appendChild(a);
        }
      }

      let raiseObs = new MutationObserver(function(muts){
        muts.forEach(m => {
          m.addedNodes.forEach(n => {
            if (!n.classList) { return; }
            if (customBets && n.classList.contains("raise-controller-form")){ updateBets(n); }
            if (rngEnabled && n.classList.contains("action-signal")){ rollRNG(); }
          });
        });
      });
      setTimeout(() => {
        try {
        raiseObs.observe(document.querySelector(".main-container"), {childList:true, subtree:true});
        }
        catch (e) { console.error(e) }
      }, 1000);
    }
  }, err => {
      alert(err);
  });
}
catch(e) {
  alert(e)
}
