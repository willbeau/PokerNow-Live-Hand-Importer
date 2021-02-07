var log = [];
var inHand = false;
var firstHand = -1;
var count = 0;

function ProcessHand(log) {
  if(log.length != 0){

    let hand = new Hand();
    hand.log = log;
    hand.multiplier = multiplier;
    hand.tableID = getTableID();
    hand.heroName = getHeroName();
    hand.convertToPokerStarsFormat();
    if(_gui.firstHand == -1){
      _gui.firstHand = hand.handNumber; 
    }
    count++;
    console.log(count + " / " + firstHand);
  }
  
}

async function getLog(lastTime, minTime) {
    setTimeout(() => {
      if (minTime == undefined){
        log = [];
        count=0;
      }
          
      var xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
          if (xhttp.readyState === XMLHttpRequest.DONE) {
              rjs = JSON.parse(this.responseText);
                for (var i = 0; i < rjs.logs.length; i++) {
                    var row = rjs.logs[i];
                    if (row.msg.includes("ending hand")){
                      inHand = true;
                    }
                    if(inHand == true){
                      log.push(row);
                    }
                    if(row.msg.includes("starting hand")){
                      inHand = false;
                      ProcessHand(log,false);
                      log = [];
                    }
                }

              if (minTime == undefined) {
                  minTime = rjs['infos']['min'];
              }
              lastTime = rjs.logs[rjs.logs.length - 1]['created_at'];
  
              if (lastTime > minTime) {
                  getLog(lastTime, minTime);
              } else {
              }
          }
      }
  
      var game_url = window.location.href;
      game_url = game_url.split("?")[0];
      game_url = game_url.split("#")[0];
  
  
      if (minTime == undefined) {
          xhttp.open("GET", game_url + "/log?after_at=&before_at=");
      } else {
          xhttp.open("GET", game_url + "/log?after_at=&before_at=" + lastTime);
      }
      xhttp.send();
    }, 4000);
}
function logButtonClicked() {
    setTimeout(function() {
        //add the button 
        var footer = document.querySelector(".log-modal-controls")
            .children[0];

        var reprocessButton = document.createElement('button');
        reprocessButton.type = "button";
        reprocessButton.className = "button-1 green small-button";
        reprocessButton.innerHTML = "Import Entire Log";
        reprocessButton.id = "Process_BTN";
        reprocessButton.addEventListener("click", processAllHands, false);
        footer.append(document.createTextNode(' '));
        footer.append(reprocessButton);


    }, 10)
    //add the button the modal thing
}
function processAllHands() {
    disableDownloadShelf();
    firstHand = -1;
    count = 0;
    getLog();
    enableDownloadShelf();
}

function setTableName(name, blinds, game) {
  document.title = `${name} - ${blinds} - ${game || ""}`;
}

module.exports = {
  getLog: getLog,
  logButtonClicked: logButtonClicked,
  processAllHands: processAllHands,
  setTableName: setTableName
}
