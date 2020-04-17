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
    sayText("Karibu kwenye huduma ya One Acre Fund. Tafadhali bonyenza nambari zako 8 za akaunti. \nBonyeza 0 ikiwa wewe si mkulima\n99) English")
};

// start logic flow

global.main = function () {
    SplashMenuText();
    promptDigits("SplashMenu", {submitOnHash: true, maxDigits: 8, timeout: 5});
}