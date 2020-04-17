// Global vars and functions
var rosterAPI = require('ext/Roster_v1_2_0/api');
var RouteIDPush = "PNd735c47103a6304e";

var LogSessionID = function(){
    console.log("Unique session id: "+call.id);
};

var TrimClientJSON = function(client){
    var SeasonCount = client.BalanceHistory.length;
    if (SeasonCount>3){client.BalanceHistory.length = 3}
    return client;
};

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

var DisplayBalance = function(client){
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

var SendPushSMStoContact = function(content, label){
    var Label = project.getOrCreateLabel(label);
    var sent_msg = project.sendMessage({
        content:  content ,
        to_number:contact.phone_number,
        route_id: RouteIDPush,
        label_ids : [Label.id]
    });    
};


// TEXT functions

var SplashMenuText = function (){
    sayText("Karibu kwenye huduma ya One Acre Fund. Tafadhali bonyenza nambari zako 8 za akaunti. \n0) How to call the call centre")
};
var CallCentreInfoText = function (){
    sayText("You can contact our call centre for free on 1234567890. Our business hours are xxx")
};
var CallCentreInfoPlusBackText = function (){
    sayText("You can contact our call centre for free on 1234567890. Our business hours are xxx\n9) Back to menu")
};
var MainMenuText = function (client){
    sayText("Select Service\n1) Check balance\n2) How to make a payment\n3) Report issue\n4) Call centre details")
};
var SplashMenuFailure = function (){
    sayText("Karibu kwenye huduma ya One Acre Fund. Tafadhali bonyenza nambari zako 8 za akaunti. \n0) How to call the call centre")
};

var CheckBalanceMenuText = function (Overpaid,Season,Credit,Paid,Balance){
    if(Overpaid){BalanceInfo = Season+":\nJumla ya malipo: "+Paid+"\nJumla ya mkopo: "+Credit+"\nMalipo kwa mkopo unaofuata: "+Balance+ "\n1) Send to me via SMS\n9) Back to menu"}
    else {BalanceInfo = Season+":\nPaid: "+Paid+"\nTotal credit: "+Credit+"\nSalio: "+Balance+ "\n1) Send to me via SMS\n9) Back to menu"}
   sayText(BalanceInfo);
    call.vars.BalanceInfo = BalanceInfo;
};

var BalanceSMSConfirmText = function(){
    sayText("Thank you we have Send you an SMS with your balance\n9) back to main")
}
var PaymentInstrucMNOSelectText = function (){
    sayText("OAF Supports the following providers:\n1) Vodacom\n2) Halotel\n3) FrancisTell\n9) Back to Menu")
};

var  InstructionsSendText = function (){
    sayText("Thank you we have send you an SMS with the payment instruction\n9) back to main")
};

var VodacomInstrucSMS = function (){
    SendPushSMStoContact("Go to this and this USSD code and do this and this with merchant id 123456", "PaymentInstruction")
};
var HalotelInstrucSMS = function (){
    SendPushSMStoContact("Go to this and this USSD code and do this and this with merchant id 123456", "PaymentInstruction")
};
var FrancisTelInstrucSMS = function (){
    SendPushSMStoContact("Go to this and this USSD code and do this and this with merchant id 123456", "PaymentInstruction")
};

var CallBackCatSelectText = function(){
    sayText("1) Sent money to wrong account number\n2) Missing Input\n3) Insurance\n4) Refund Request\n5) Update:Phone Number\n6) Other\n9) back to main")
}

var CallBackConfirmText = function(){
    sayText("Thank you we have recorded your request, you will receive a call from our agent within the next 2 business days\n9) back to main")
}



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
        DisplayBalance(client);
        promptDigits("BalanceContinue", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (MainMenu == 2){
        PaymentInstrucMNOSelectText();
        promptDigits("PaymentMNO", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (MainMenu == 3){
        CallBackCatSelectText();
        promptDigits("CatSelect", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (MainMenu == 4){
        CallCentreInfoPlusBackText();
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

// PaymentMNO

addInputHandler("PaymentMNO", function(input) {
    LogSessionID();
    InteractionCounter("PaymentMNO");
    var client = JSON.parse(state.vars.client);
    if (input == 9){
        MainMenuText (client);
        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (input == 1){
        VodacomInstrucSMS();
        InstructionsSendText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

    else if (input == 2){
        HalotelInstrucSMS();
        InstructionsSendText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

    else if (input == 3){
        FrancisTelInstrucSMS();
        InstructionsSendText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

    else {
        PaymentInstrucMNOSelectText();
        promptDigits("PaymentMNO", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

});

addInputHandler("CatSelect", function(input) {
    LogSessionID();
    InteractionCounter("CatSelect");
    var client = JSON.parse(state.vars.client);
    if (input == 1 || input == 2 || input == 3|| input == 4 ||input == 5 || input == 6){
        CallBackConfirmText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (input == 9){
        MainMenuText (client);
        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else{
        CallBackCatSelectText();
        promptDigits("CatSelect", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
})

// BalanceContinue

addInputHandler("BalanceContinue", function(input) {
    LogSessionID();
    InteractionCounter("BalanceContinue");
    var client = JSON.parse(state.vars.client);
    if (input == 1){
        SendPushSMStoContact(call.vars.BalanceInfo, "BalanceInfo");
        BalanceSMSConfirmText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (input == 9){
        MainMenuText (client);
        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else{
        DisplayBalance();
        promptDigits("BalanceContinue", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
})