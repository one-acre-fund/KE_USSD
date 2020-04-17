// Global vars and functions
var rosterAPI = require('ext/Roster_v1_2_0/api');

var InteractionCounter = function(input){
    try{
        if (typeof(state.vars.InteractionCount) == 'undefined') {state.vars.InteractionCount = 1}
        else{state.vars.InteractionCount = state.vars.InteractionCount +1}
        call.vars.InteractionCount = state.vars.InteractionCount;
        if (typeof(input) !== 'undefined') {
            var Now = moment().format('X');
            var varString = "call.vars.TimeStamp_"+input+"= Now";
            eval(varString);
        }
    }
    catch(err) {
        console.log("Error occurred in interaction counter")
      }
};
var RosterClientVal = function (AccNum){
    if (typeof AccNum === "undefined" || AccNum == ""){
        return false;
    }
    else{
        console.log("Validating accountnumber length. Result: "+ AccNum.length);
        if (AccNum.length == 8){
            rosterAPI.verbose = true;
            rosterAPI.dataTableAttach();
            response = rosterAPI.authClient(AccNum,'KE');
            return response;
        }
        else {
            return false
        }
    }
};
var RosterClientGet = function (AccNum){
    rosterAPI.verbose = true;
    rosterAPI.dataTableAttach();
    client = rosterAPI.getClient(AccNum,'KE');
    return client;
};

// TEXT functions

var SplashMenuText = function (){
    sayText("Karibu kwenye huduma ya One Acre Fund. Tafadhali bonyenza nambari zako 8 za akaunti. \n0) How to call the call centre")
};
var CallCentreInfoText = function (){
    sayText("You can contact our call centre for free on 1234567890\n9) Back to menu")
};
var MainMenuText = function (client){
    sayText("Select Service\n1) Check balance\n2) How to make a payment\n3) Report issue\n4) Call centre details")
};
var SplashMenuFailure = function (){
    sayText("Karibu kwenye huduma ya One Acre Fund. Tafadhali bonyenza nambari zako 8 za akaunti. \n0) How to call the call centre")
};

var CheckBalanceMenuText = function (Overpaid,Season,Credit,Paid,Balance){
    if(Overpaid){sayText(Season+":\nJumla ya malipo: "+Paid+"\nJumla ya mkopo: "+Credit+"\nMalipo kwa mkopo unaofuata: "+Balance+ "\n9) Back to menu")}
    else {sayText(Season+":\nPaid: "+Paid+"\nTotal credit: "+Credit+"\nSalio: "+Balance+ "\n9) Back to menu")}
    var BalanceInfo = "Balance: "+Balance+ "\nSeason: "+Season+ "\nCredit: "+Credit+ "\nPaid: "+Paid+ "\nOverpaid: "+Overpaid;
    call.vars.BalanceInfo = BalanceInfo;
};


// start logic flow

global.main = function () {
    SplashMenuText();
    promptDigits("SplashMenu", {submitOnHash: true, maxDigits: 8, timeout: 5});
}

addInputHandler("SplashMenu", function(SplashMenu) {
    LogSessionID();
    InteractionCounter("SplashMenu");
    ClientAccNum = SplashMenu;
    if (SplashMenu == "0"){
        CallCentreInfoText();
        hangUp();
    }
    else {
        if (RosterClientVal(ClientAccNum)){
            console.log("SuccessFully Validated against Roster");
            client = RosterClientGet(ClientAccNum);
            state.vars.client = JSON.stringify(TrimClientJSON(client));
            call.vars.AccNum = ClientAccNum;
            MainMenuText (client);
            promptDigits("MainMenu", {submitOnHash: true, maxDigits: 8, timeout: 5});
        }
        else{
            console.log("account number not valid");
            SplashMenuFailure();
            promptDigits("SplashMenu", {submitOnHash: true, maxDigits: 8, timeout: 5});
        }
    }
});

addInputHandler("MainMenu", function(MainMenu) {
    LogSessionID();
    InteractionCounter("MainMenu");
    client = JSON.parse(state.vars.client);
    if (MainMenu == 1){
        else{
            var arrayLength = client.BalanceHistory.length;
            var Balance = '';
            var Season = "";
            var Overpaid = false;
            var Credit = "";
            var Paid = "";
            for (var i = 0; i < arrayLength; i++) {
                if (client.BalanceHistory[i].Balance>0){
                    Season = client.BalanceHistory[i].SeasonName;
                    Paid = client.BalanceHistory[i].TotalRepayment_IncludingOverpayments;
                    Balance = client.BalanceHistory[i].Balance;
                    Credit = client.BalanceHistory[i].TotalCredit;
                }
            }
            if (Balance === ''){
                for (var j = 0; j < arrayLength; j++) {
                    if (client.BalanceHistory[j].TotalRepayment_IncludingOverpayments>0){
                        Paid = client.BalanceHistory[j].TotalRepayment_IncludingOverpayments;
                        Balance = client.BalanceHistory[j].Balance;
                        Credit = client.BalanceHistory[j].TotalCredit;
                        Season = client.BalanceHistory[j].SeasonName;
                        j = 99;
                        Overpaid = true;
                    }
                }
            }
            CheckBalanceMenuText (Overpaid,Season,Credit,Paid,Balance);
    }
    else if (MainMenu == 2){

    }
    else if (MainMenu == 3){

    }
    else if (MainMenu == 4){
        CallCentreInfoText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else {
        MainMenuText (client);
        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

});

addInputHandler("BackToMain", function(input) {
    LogSessionID();
    InteractionCounter("BackToMain");
    var client = JSON.parse(state.vars.client);
    MainMenuText (client);
    promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
});