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
            response = rosterAPI.authClient(AccNum,'TZ');
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
    client = rosterAPI.getClient(AccNum,'TZ');
    return client;
};

var DisplayBalance = function(client){

    var i = state.vars.SeasonCount;
    if (typeof(client.BalanceHistory[i+1]) == 'undefined'){state.vars.NextSeason = false}
    else{state.vars.NextSeason = true}
    if (typeof(client.BalanceHistory[i].SeasonName) !== 'undefined'){

        var Season = client.BalanceHistory[i].SeasonName;
        var Paid = client.BalanceHistory[i].TotalRepayment_IncludingOverpayments;
        var Balance = client.BalanceHistory[i].Balance;
        var Credit = client.BalanceHistory[i].TotalCredit;
        var RegionName = client.RegionName;
        var DistanceToHealthy = GetHeathyPathPercent (Season, RegionName);
        console.log("DistanceToHealth: "+ DistanceToHealthy)
        if (DistanceToHealthy === false){console.log("no distance to healthy path set")}
        else {DistanceToHealthy =Math.round( Math.max(DistanceToHealthy* Credit - Paid,0))}
        if (DistanceToHealthy === 0){DistanceToHealthy = "-"};
        CheckBalanceMenuText (Season,Credit,Paid,Balance,DistanceToHealthy);

    }
    else {sayText(call.vars.BalanceInfo+ "\n2. Nitumie taarifa kwa meseji\n9. Rudi mwanzo")}
}

var GetHeathyPathPercent = function (Season,RegionName){
    var table = project.getOrCreateDataTable("HealthyPath");
    var weeknumber = moment().week();
    console.log("Region: "+RegionName);
    console.log("Season: "+Season);
    console.log("Current week number = "+weeknumber);
    cursorRegion = table.queryRows({
        vars: {'regionname': RegionName, 'seasonname': Season, 'weeknumber':weeknumber}
    });
    console.log("Checking for specific region");
    cursorRegion.limit(1);
    if (cursorRegion.hasNext()){
        
        var row = cursorRegion.next();
        console.log("Percentage for specific region found: "+ row.vars.percentage);
        return row.vars.percentage;
    }
    else {
        cursorDefault = table.queryRows({
            vars:{'regionname': "Default", 'seasonname': Season, 'weeknumber':weeknumber}
        });
        console.log("Checking for default");
        cursorDefault.limit(1);
        if (cursorDefault.hasNext()){
            var row = cursorDefault.next();
            console.log("Percentage for default found: "+ row.vars.percentage);
            return row.vars.percentage;
        }
        else {
            console.log("No heathy path data found")
            return false
        }
    }
}

var CheckBalanceMenuText = function (Season,Credit,Paid,Balance, DistanceToHealthy){
    var client = JSON.parse(state.vars.client);
    var firstname = client.FirstName;
    if(DistanceToHealthy === false){BalanceInfo = "Habari "+firstname+ "\n"+Season.substring(0, 4)+"\nUmelipa: "+Paid+"/"+Credit+"\nIliyobaki: "+Balance}
    else{BalanceInfo = "Habari "+firstname+ "\n"+ Season.substring(0, 4)+"\nUmelipa: "+Paid+"/"+Credit+"\nIliyobaki: "+Balance+"\nKiasi ili kufikia lengo: "+ DistanceToHealthy}
    if (state.vars.NextSeason){sayText(BalanceInfo+  "\n1. Msimu uliopita\n2. Nitumie taarifa kwa meseji")}
    else{sayText(BalanceInfo+  "\n2. Nitumie taarifa kwa meseji\n9. Rudi mwanzo")}
    call.vars.BalanceInfo = BalanceInfo;
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
    sayText("Karibu One Acre Fund. Tafadhali andika namba yako ya akaunti\nPiga 0800713888 bure kama umeisahau namba yako au bonyeza 1 kuomba upigiwe")
};
var CallCentreInfoPlusBackText = function (){
    sayText("Tafadhali piga 0800713888 bure, Jumatatu hadi Ijumaa kuanzia saa 2 asubuhi hadi saa 11 jioni. Asante\n9. Rudi mwanzo")
};
var MainMenuText = function (client){
    sayText("Tukuhudumie nini leo?\n1. Angalia salio\n2. Jinsi ya kufanya marejesho\n3. Tafadhali nipigie\n4. Wasiliana na huduma kwa wateja")
};
var SplashMenuFailure = function (){
    sayText("Namba ya akaunti uliyoingiza sio sahihi.Tafadhali angalia kwa usahihi namba yako unayotumia kufanya malipo, na uingize tena. Asante sana")
};

var BalanceSMSConfirmText = function(){
    sayText("Asante sana. Taarifa za maendeleo ya marejesho yako zimetumwa kwa meseji.\n1. Jinsi ya kufanya marejesho\n9. Rudi mwanzo")
}
var PaymentInstrucMNOSelectText = function (){
    sayText("1. M-Pesa\n2. Tigopesa\n3. Halopesa\n9. Rudi mwanzo")
};

var  InstructionsSendText = function (){
    sayText("Asante sana. Taarifa za jinsi ya kutuma marejesho kwa njia ya simu zimetumwa kwa meseji. Wakulima Kwanza\n9. Rudi mwanzo")
};

var VodacomInstrucSMS = function (){
    SendPushSMStoContact("Piga *150*00#\nChagua 4, Lipa kwa M-Pesa\nChagua 4, Ingiza Namba 354466\nIngiza akaunti namba yako\nIngiza kiasi\nIngiza neno la siri\nIngiza 1 kuthibitisha muamala", "Payment instruction")
};
var TigoInstrucSMS = function (){
    SendPushSMStoContact("Piga *150*01#\nChagua 4, Lipa Bill\nChagua 3, Ingiza Namba 354466\nIngiza namba yako ya akaunti\nIngiza kiasi\nIngiza neno lako la siri\nIngiza 1 kuthibitisha muamala", "PaymentInstruction")
};
var HaloInstrucSMS = function (){
    SendPushSMStoContact("Piga *150*88#\nChagua 4, Lipa bili\nChagua 3, Ingiza Namba 354466\nIngiza akaunti namba yako\nIngiza kiasi\nIngiza neno la siri\nIngiza 1 kuthibitisha muamala", "PaymentInstruction")
};

var CallBackCatSelectText = function(){
    sayText("1. Nimekosea kutuma marejesho\n2. Nimekosa pembejeo\n3. Shida juu ya fao la mazishi\n4. Nahitaji kurudishiwa fedha\n9. Rudi mwanzo")
}

var CallBackConfirmText = function(){
    sayText("Asante sana kwa kuomba upigiwe. Utapigiwa simu na Huduma kwa wateja hivi karibuni kwa siku na muda wa kazi\n9. Rudi mwanzo")
}

var CallBackConfirmNoBackText = function(){
    sayText("Asante sana kwa kuomba upigiwe. Utapigiwa simu na Huduma kwa wateja hivi karibuni kwa siku na muda wa kazi")
}

// start logic flow

global.main = function () {
    SplashMenuText();
    promptDigits("SplashMenu", {submitOnHash: true, maxDigits: 8, timeout: 5});
}

addInputHandler("SplashMenu", function(SplashMenu) {
    LogSessionID();
    InteractionCounter("SplashMenu");
    if (SplashMenu == 1){
        var create_zd_ticket = require('ext/zd-tr/lib/create-ticket');
        var sub = "USSD - Call back request";
        if(create_zd_ticket("Unknown", sub, contact.phone_number)){
            console.log('created_ticket!');
            CallBackConfirmNoBackText();
            hangUp();
        }
        else{
            console.log('create_ticket failed on ' + client.AccountNumber);
            SplashMenuText();
            promptDigits("SplashMenu", {submitOnHash: true, maxDigits: 8, timeout: 5});
        }
    }
    else {
        ClientAccNum = SplashMenu;
        if (RosterClientVal(ClientAccNum)){
            console.log("SuccessFully Validated against Roster");
            client = RosterClientGet(ClientAccNum);
            state.vars.client = JSON.stringify(TrimClientJSON(client));
            call.vars.client = JSON.stringify(TrimClientJSON(client));
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
    state.vars.SeasonCount = 0;
    LogSessionID();
    InteractionCounter("MainMenu");
    client = JSON.parse(state.vars.client);
    console.log(state.vars.client)
    if (MainMenu == 1){
        DisplayBalance(client);
        promptDigits("BalanceContinue", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (MainMenu == 2){
        PaymentInstrucMNOSelectText();
        promptDigits("PaymentMNO", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (MainMenu == 3){

        var create_zd_ticket = require('ext/zd-tr/lib/create-ticket');
        var client = JSON.parse(state.vars.client);

        var sub = "USSD - Call back request";
        if(create_zd_ticket(client.AccountNumber, sub, contact.phone_number)){
            console.log('created_ticket!');
            CallBackConfirmText();
            promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
        }
        else{
            console.log('create_ticket failed on ' + client.AccountNumber);
            MainMenuText (client);
            promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
        }
        
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
        TigoInstrucSMS();
        InstructionsSendText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

    else if (input == 3){
        HaloInstrucSMS();
        InstructionsSendText();
        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

    else {
        PaymentInstrucMNOSelectText();
        promptDigits("PaymentMNO", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

});

//addInputHandler("CatSelect", function(input) {
//    LogSessionID();
//    InteractionCounter("CatSelect");
//    var client = JSON.parse(state.vars.client);
//    if (input == 1 || input == 2 || input == 3|| input == 4 ){
//        var issuetype = ""
//        if (input == 1){issuetype = "Sent money to wrong account number"}
//        else if (input == 2){issuetype = "Missing Input"}
//        else if (input == 3){issuetype = "Funeral Insurance"}
//        else if (input == 4){issuetype = "Refund Request"}
//
//        var create_zd_ticket = require('ext/zd-tr/lib/create-ticket');
//        var client = JSON.parse(state.vars.client);
//
//        var sub = "Call back requested for: " + issuetype +" account number : "+ client.AccountNumber+ "With phonenumber: "+ contact.phone_number;
//        if(create_zd_ticket(client.AccountNumber, sub, contact.phone_number)){
//            console.log('created_ticket!');
//        }
//        else{
//            console.log('create_ticket failed on ' + client.AccountNumber);
//        }
//        CallBackConfirmText();
//        promptDigits("BackToMain", {submitOnHash: true, maxDigits: 1, timeout: 5});
//    }
//    else if (input == 9){
//        MainMenuText (client);
//        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
//    }
//    else{
//        CallBackCatSelectText();
//        promptDigits("CatSelect", {submitOnHash: true, maxDigits: 1, timeout: 5});
//    }
//})

addInputHandler("BalanceContinue", function(input) {
    LogSessionID();
    InteractionCounter("BalanceContinue");
    var client = JSON.parse(state.vars.client);
    if (input == 1 && state.vars.NextSeason){
        state.vars.SeasonCount = state.vars.SeasonCount +1;
        DisplayBalance(client);
        promptDigits("BalanceContinue", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (input == 2){
        SendPushSMStoContact(call.vars.BalanceInfo, "BalanceInfo");
        BalanceSMSConfirmText();
        promptDigits("BalanceSMSContinue", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (input == 9){
        MainMenuText (client);
        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else{
        DisplayBalance(client);
        promptDigits("BalanceContinue", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
})

addInputHandler("BalanceSMSContinue", function(input) {
    LogSessionID();
    InteractionCounter("BalanceSMSContinue");

    if (input == 1){
        PaymentInstrucMNOSelectText();
        promptDigits("PaymentMNO", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }
    else if (input == 9){
        MainMenuText (client);
        promptDigits("MainMenu", {submitOnHash: true, maxDigits: 1, timeout: 5});
    }

});