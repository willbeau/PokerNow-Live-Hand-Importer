const SITE_NAME = "PokerStars";

//REQUIRES:  rawLog, smallBlind,bigBlind,multiplier,heroName,handID
class Hand {
    constructor() {
        this.id = "";
        this.time;
        this.players = [];
        this.log;
        this.output = "";

        this.bigBlind = 0.0;
        this.smallBlind = 0.0;
        this.rawLog = "";
        this.heroName = "";
        this.tableID = "";
        this.multiplier = 1.0;

        this.buttonSeat = -1;
        this.flop = "";
        this.turn = "";
        this.river = "";

        //RIT variables
        this.secondFlop = "";
        this.secondTurn = "";
        this.secondRiver = "";

        this.hero;


        //total blind amount
        this.blindAmount = 0.0;
        this.potSize = 0.0;
        this.betSize = 0.0;
        this.street = 0; //current street
        //Player actions on each street
        this.preflopActions = "";
        this.flopActions = "";
        this.turnActions = "";
        this.riverActions = "";
        this.showdownActions = "";

        this.secondRiverActions = "";

        this.hasEnded = false;

        this.blindCount = 0; // # of players that have posted blinds
        this.acted = 0;
        
        this.givenBlinds = false; //if blinds are provided

        this.gameType = "";

        this.runTwice = false;
        this.allInStreet = 0;
    }
    //Converts hand to pokerstars format
    convertToPokerStarsFormat() {
        if(typeof this.rawLog == 'undefined'){
            return;
        }
        this.setVariables();
        if (!this.rawLog.includes("ending hand") || !this.rawLog.includes("starting hand")) {
            return;
        }
        
        //sets variables required for running it twice
        if(this.rawLog.includes("River (second run):")){
            this.runTwice = true;
            this.allInStreet = 2;
            if(this.rawLog.includes("Turn (second run):")){
                this.allInStreet = 1;
                if(this.rawLog.includes("Flop (second run):")){
                    this.allInStreet = 0;
                }
            }
        }

        this.processLog();
        //sets hand headers
        this.output = SITE_NAME + " Hand #" + this.handID + ": " + this.gameType + "($" + this.smallBlind + "/$" + this.bigBlind + " USD) - " + this.time + " GMT" + '\n';
        this.output += "Table '" + this.tableID + "' 10-max Seat #" + this.buttonSeat + " is the button" + '\n';

        //sets stack size section of output
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            this.output += "Seat " + player.seat + ": " + player.name + " ($" + player.stackSize + " in chips)" + '\n';
        }

        //set ante section of output
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player.ante){
                if(player.allinFromAnte){
                    this.output += player.name + ": posts the ante $" + player.anteAmount + " and is all-in"+  '\n';
                }else{
                    this.output += player.name + ": posts the ante $" + player.anteAmount + '\n';
                }
                
            }
        }


        //Sets small blinds section of output
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player.smallBlind && !player.bigblind && !player.missingSmallBlind) {
                this.output += player.name + ": posts small blind $" + player.smallBlindAmount + '\n';
            }
        }
        //Sets big blinds section of output
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player.bigBlind) {
                if(!player.smallBlind){
                    this.output += player.name + ": posts big blind $" + player.bigBlindAmount + '\n';
                }
                
            }
        }

        //sets missing blinds section of output
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i]; //if player is bigblind and smallblind
            if (player.smallBlind) {
                if(player.bigBlind){
                    this.output += player.name + ": posts big blind $" + round(player.smallBlindAmount + player.bigBlindAmount,2) + '\n';
                }
            }
            if(player.missingSmallBlind){
                this.output += player.name + ": posts missing small blind $" + round(player.smallBlindAmount,2) + '\n';
            }
        }
        //sets straddle section of output
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i]; 
            if(player.straddle){
                this.output += player.name + ": posts straddle $" + round(player.straddleAmount,2) + '\n';
            }
        }
        

        //Sets heros hole cards
        this.output += "*** HOLE CARDS ***" + '\n';
        if (typeof this.hero != 'undefined') {
            this.output += "Dealt to " + this.hero.name + " [" + this.hero.hand + "]" + '\n';
        }

        //Sets actions of the hand
        let str = " "; //adjustment string for flop, turn, and river
        if(this.runTwice){
            str = " FIRST ";
        }
        
        for (let i = 0; i <= this.street; i++) {
            switch (i) {
                case 0:
                    this.output += this.preflopActions
                    break;
                case 1:
                    this.output += "***"  + str + "FLOP *** [" + this.flop + "]" + '\n';
                    this.output += this.flopActions;
                    break;
                case 2:
                    this.output += "***"  + str + "TURN *** [" + this.flop + "] [" + this.turn + "]" + '\n';
                    this.output += this.turnActions;
                    break;
                case 3:
                    this.output += "***"  + str + "RIVER *** [" + this.flop + " " + this.turn + "] [" + this.river + "]" + '\n';
                    this.output += this.riverActions;

                    if(this.runTwice){
                        str = " SECOND ";

                        if(this.allInStreet == 0){
                            this.output += "***"  + str + "FLOP *** [" + this.secondFlop + "]" + '\n';
                            this.output += "***"  + str + "TURN *** [" + this.secondFlop + "] [" + this.secondTurn + "]" + '\n';
                            this.output += "***"  + str + "RIVER *** [" + this.secondFlop + " " + this.secondTurn + "] [" + this.secondRiver + "]" + '\n';
                        }
                        if(this.allInStreet == 1){
                            this.output += "***"  + str + "TURN *** [" + this.flop + "] [" + this.secondTurn + "]" + '\n';
                            this.output += "***"  + str + "RIVER *** [" + this.flop + " " + this.secondTurn + "] [" + this.secondRiver + "]" + '\n';
                        }
                        if(this.allInStreet == 2){
                            this.output += "***"  + str + "RIVER *** [" + this.flop + " " + this.turn + "] [" + this.secondRiver + "]" + '\n';
                        }
                    }

                    break;
                case 4:
                    this.output += "***"  + str + "SHOWDOWN ***" + '\n';
                    this.output += this.showdownActions;
            }
        }

        //handle players who showed
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if(player.hand != ""){
                this.output +=  player.name + ": shows [" + player.hand + "]" + '\n';
            }
        }
        
        //Sets summary of hand
        
        this.output += "*** SUMMARY ***" + '\n';
        this.output += "Total pot: " + "$" + round(this.potSize,2) + " | Rake 0" + '\n';

        //go through each player and write summary
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            let extraMessage = "";
            if (player.bigBlind) extraMessage = " (big blind)";
            if (player.smallBlind) extraMessage = " (small blind)";
            if (player.button) extraMessage = " (button)";
            switch (player.foldStreet) {
                case 0:
                    extraMessage += " folded before Flop";
                    if(!player.didBet){
                        extraMessage += " (didn't bet)";
                    }
                    break;
                case 1:
                    extraMessage += " folded on the Flop";
                    break;
                case 2:
                    extraMessage += " folded on the Turn";
                    break;
                case 3:
                    extraMessage += " folded on the River";
                    break;
                case -1:
                    if(player.hand != ''){
                        //player showed
                        extraMessage += " showed [" + player.hand + "]";
                    }
                    if(player.won){
                        //player won at showdown
                        extraMessage += " and won ($" + round(player.winAmount,2) + ")"
                    }else{
                        //player lost at showdown
                        extraMessage += " and lost";
                    }
           

            }
            if(player.hand != ''){
                extraMessage += " [" + player.hand + "]";
            }
            this.output += "Seat " + player.seat + ": " + player.name + extraMessage + '\n';
        }
        console.log("Saving hand " + this.handNumber);
        saveText(this.output,"pokernow_hands/" + this.smallBlind + "-" + this.bigBlind + " " + this.tableID + "-" + this.handNumber + ".txt")
    }
    processLog() {
        //iterate through each line in the log

        for (let i = 0; i < this.log.length; i++) {
            let line = this.log[i].msg;
            let startP = -1;
            let endP = -1;
            let player = this.getPlayerfromLine(line);
            let action = "";
            if (line.includes("Flop: ")) {
                startP = line.indexOf("[") + 1;
                endP = line.indexOf("]");
                this.flop = fixCards(line.substring(startP, endP).replaceAll(",", ""));
                this.street = 1; //set current street to flop
                this.newStreet();
            }else if(line.includes("-- starting hand")){
                endP = line.lastIndexOf('"');
                startP = line.lastIndexOf("@", endP) + 2;
                let id = line.substring(startP, endP);
                for (let i = 0; i < this.players.length; i++) {
                    let player = this.players[i];
                    if(player.id == id){
                        player.button = true;
                        this.buttonSeat = player.seat;
                    }
                }
            }else if (line.includes("Turn: ")) {
                //turn
                startP = line.indexOf("[") + 1;
                endP = line.indexOf("]");
                this.turn = fixCards(line.substring(startP, endP));
                this.street = 2; //set current street to turn
                this.newStreet();
            } else if (line.includes("River: ")) {
                //river
                startP = line.indexOf("[") + 1;
                endP = line.indexOf("]");
                this.river = fixCards(line.substring(startP, endP));
                this.street = 3; //set current street to river
                this.newStreet();
            }else if(line.includes("Flop (second run):")){

                startP = line.indexOf("[") + 1;
                endP = line.indexOf("]");
                this.secondFlop = fixCards(line.substring(startP, endP).replaceAll(",", ""));

            }else if(line.includes("Turn (second run):")){

                startP = line.indexOf("[") + 1;
                endP = line.indexOf("]");
                this.secondTurn = fixCards(line.substring(startP, endP).replaceAll(",", ""));

            }else if(line.includes("River (second run):")){

                startP = line.indexOf("[") + 1;
                endP = line.indexOf("]");
                this.secondRiver = fixCards(line.substring(startP, endP).replaceAll(",", ""));

            } else if (line.includes("small blind")) {
                //small blind
                //gets how much the player posted for the blind
                startP = line.lastIndexOf("blind of") + 9;
                endP = line.length;
                player.smallBlindAmount = parseFloat(line.substring(startP, endP));
                player.didBet = true;
                if(line.includes("missing blind of")){
                    this.missingSmallBlind = true;
                }
                player.smallBlind = true;
                player.betSize = player.smallBlindAmount;

                this.blindCount++;

                if(!this.givenBlinds){
                    this.smallBlind = player.smallBlindAmount;
                }
            } else if (line.includes("posts an ante of")){
                startP = line.lastIndexOf("ante of") + 8;
                endP = line.length;
                player.anteAmount = parseFloat(line.substring(startP, endP));
                player.ante = true;

                if(line.includes("and go all in")){
                    player.allinFromAnte = true;
                }
            } else if (line.includes("big blind")) {
                //big blind
                //gets how much player posted for the blind (we check in case the player has less then 1 blind)
                startP = line.lastIndexOf("blind of") + 9;
                endP = line.length;
                player.didBet = true;
                player.bigBlindAmount = parseFloat(line.substring(startP, endP));
                player.betSize = player.bigBlindAmount;
                player.bigBlind = true;

                if(!this.givenBlinds){   
                    this.bigBlind = player.bigBlindAmount;
                }
                this.betSize = this.bigBlind;

                this.blindCount ++;

            }else if (line.includes("posts a straddle")){
                    //straddle
                    startP = line.lastIndexOf("straddle of") + 12;
                    endP = line.length;
                    player.didBet = true;
                    player.straddleAmount = parseFloat(line.substring(startP, endP));
                    player.betSize = player.straddleAmount;
                    player.straddle = true;
                    this.betSize = player.straddleAmount;
                    this.blindCount ++;
            }
             else if (line.includes("Your hand is ")) {
                startP = 13;
                endP = line.length;
                this.hero.hand = fixCards(line.substring(startP, endP)).replaceAll(",", "");

            } else if (line.includes(" calls ")) {
                //calls
                this.acted++;
                if(line.includes("go all in")){
                    //player calls all in
                    startP = line.lastIndexOf("calls ") + 6;
                    endP = line.indexOf("and go") - 1;
                    let callSize = round(parseFloat(line.substring(startP,endP))- player.betSize,2);
                    player.didBet = true;
                    action = player.name + ": calls $" + callSize + " and is all-in";
                }else{
                    //player calls bet
                    let callSize = round(this.betSize - player.betSize,2); //current bet size - the amount the player has already put into the pot
                    player.betSize = round(this.betSize,2);
                    action = player.name + ": calls $" + callSize;
                }
            } else if (line.includes("checks")) {
                //checks
                this.acted++;
                action = player.name + ": checks";
            } else if (line.includes(" raises to ")) {
                //raises

                //finds betsize and raise amount
                this.acted++;
                
                startP = line.lastIndexOf(" raises to ") + 11;
                endP = line.length;
                let betSize = round(parseFloat(line.substring(startP, endP)),2);
                let raiseAmount = round(betSize - this.betSize,2);

                //Sets necessary variables
                this.betSize = betSize;
                player.betSize = betSize;
                player.didBet = true;
                if(line.includes("go all in")){
                    action = player.name + ": raises $" + raiseAmount + " to $" + this.betSize + " and is all-in"
                }else{
                    action = player.name + ": raises $" + raiseAmount + " to $" + this.betSize;
                }
                

            } else if (line.includes(" folds")) {
                //folds
                this.acted++;
                action = player.name + ": folds";
                player.foldStreet = this.street;
            } else if (line.includes(" bets ")) {
                //player bets
                this.acted++;
                startP = line.lastIndexOf(" bets ") + 6;
                if(line.includes("and go all in")){
                    endP = line.lastIndexOf("and go all in") - 1;
                    let betSize = round(line.substring(startP, endP),2); //amount the player bet
                    this.betSize = betSize;
                    player.betSize = betSize;
                    action = player.name + ": bets $" + betSize + " and is all-in";
                }else{
                    endP = line.length;
                    let betSize = round(line.substring(startP, endP),2); //amount the player bet
                    this.betSize = betSize;
                    player.betSize = betSize;
                    action = player.name + ": bets $" + betSize;
                }
                
            } else if (line.includes(" shows a ")) {
                //player shows their hand
                startP = line.lastIndexOf(" shows a ") + 9;
                endP = line.length - 1;
                let cards = fixCards(line.substring(startP, endP)).replaceAll(",", "");
                player.hand = cards;
                
                if(!this.hasEnded){ //someone showed before game ended, therefore we're at showdown
                    this.street = 4;
                }
            } else if (line.includes(" collected ")) {
                startP = line.lastIndexOf(" collected ") + 11;
                endP = line.indexOf("from pot", startP) - 1;
                let collectAmount = round(line.substring(startP, endP),2);
                action = player.name + ": collected $" + collectAmount
                this.potSize += collectAmount;
                this.hasEnded = true;
                player.won = true;
                player.winAmount += collectAmount;
            }else if(line.includes("Uncalled bet of ")){
                if(!player.uncalled){
                    startP = 15
                    endP = line.indexOf(" returned to");
                    let amount = round(line.substring(startP, endP),2);
                    player.uncalled = true;
                    action = "Uncalled bet ($" + amount + ") returned to " + player.name;
                }   
            }

            //set button

            //player is the last to act preflop - thus the button
            if(this.buttonSeat == -1){
                if(this.street == 0 && this.acted == (this.players.length - this.blindCount) && typeof player != 'undefined'){
                    this.buttonSeat = player.seat;
                    player.button = true;
                }
            }
            if (action != '') {
                switch (this.street) {
                    case 0:
                        this.preflopActions += action + '\n'
                        break;
                    case 1:
                        this.flopActions += action + '\n'
                        break;
                    case 2:
                        this.turnActions += action + '\n'
                        break;
                    case 3:
                        this.riverActions += action + '\n'
                        break;
                    case 4:
                        this.showdownActions += action + '\n';
                        break;
                }
            }
        }
    }
    //Resets the betsize for each player back to 0
    newStreet() {
        this.betSize = 0;
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            player.betSize = 0.0;
        }
    }
    getPlayerfromLine(line) {
        let endP = line.lastIndexOf('"');
        let startP = line.lastIndexOf('@', endP) + 2;
        let id = line.substring(startP, endP);
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id == id) {
                return this.players[i];
            }
        }
    }

    //Sets all required variables needed to convert hand to pokerstars format
    setVariables() {
        if(this.rawLog == ""){
            this.rawLog = JSON.stringify(this.log);
            this.log.reverse();
        }else{
            this.setLog();
        }
        this.setTime();
        this.setHandID();
        this.getPlayers();
        
    }

    //Create player objects
    getPlayers() {
        this.players = [];
        let line = this.log[this.lineContaining('Player stacks: #')].msg;
        let i = 0;
        line.replace("Player stacks: #", "").split(' | #').forEach(data => {
            //get seat number
            let seatNumber = data.substring(0, data.indexOf(" "));

            //get stack size
            let startP = data.lastIndexOf('"') + 3;
            let endP = data.indexOf(")", startP);
            let stackSize = data.substring(startP, endP);

            //get name
            endP = data.lastIndexOf('"');
            endP = data.lastIndexOf("@", endP) - 1;
            startP = data.lastIndexOf('"', endP) + 1;
            let name = data.substring(startP, endP);

            //get ID
            endP = data.lastIndexOf('"');
            startP = data.lastIndexOf("@", endP) + 2;
            let id = data.substring(startP, endP);
            //Create player objects
            let player = new Player;
            player.name = name;

            player.seat = seatNumber;
            player.id = id;
            player.stackSize = stackSize;
            player.index = i;
            if (name == this.heroName) {
                this.hero = player;
            }
            this.players.push(player);
            i++;
        });;
    }

    //returns index of line in the logs containing some string
    lineContaining(str) {
        for (let i = 0; i < this.log.length; i++) {
            this.log[i].msg;
            if (this.log[i].msg.includes(str)) {
                return i;
            }
        }
    }

    //sets log variable by cleaning up the raw log variable and parsing it as json
    setLog() {
        let splitStr = this.rawLog.split('{"msg":');
        let strOut = '';
        for (let i = 1; i < splitStr.length; i++) {
            let line = splitStr[i];
            let endP = line.indexOf(',"game_id":');
            let newLine = line;
            if (endP != 0) {
                newLine = line.substring(0, endP) + '},';
            }
            strOut = strOut + '{"msg":' + newLine;
        }
        strOut = strOut.substring(0, strOut.length - 1);
        strOut = '[ ' + strOut + "]";

        this.log = JSON.parse(strOut);
        this.log.reverse();
        console.log(this.log);
    }
    //gets time of hand
    setTime() {
        let startP = this.rawLog.indexOf("-- starting hand #") + 18;
        startP = this.rawLog.indexOf('"at":"', startP) + 6;
        let endP = this.rawLog.indexOf('.', startP);
        this.time = this.rawLog.substring(startP, endP).replaceAll("-", "/").replaceAll("T", " ");
    }
    //Gets hand number
    setHandNumber() {
        let startP = this.rawLog.indexOf("-- starting hand #") + 18;
        let endP = this.rawLog.indexOf("(", startP);
        this.handNumber = this.rawLog.substring(startP, endP).replaceAll(" ", "");
    }
    //Sets hand ID by concatinating the table ID and the hand Number and converting it to an integer
    setHandID() {
        let tableName = this.tableID.replace("-", "")
        this.setHandNumber();
        let id = convertToNumber((tableName).replace(/\s+/g, '')).join("") + this.handNumber;
        id = id.substring(id.length - 15, id.length);
        this.handID = id;

    }
}






