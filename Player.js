class Player{
  constructor(){
    this.id;
    this.seat = -1;
    this.hand = "";
    this.smallBlind = false;
    this.bigBlind = false;
    this.button = false;
    this.stackSize = 0.0;
    this.multiplier = 1;
    this.foldStreet = -1;
    this.didBet = false;
    this.index = -1;
    this.smallBlindAmount = 0.0;
    this.bigBlindAmount = 0.0;
    this.betSize = 0.0; //how much money player has already put into the pot on this street
    this.won = false;
    this.winAmount = 0.0;
  }
}