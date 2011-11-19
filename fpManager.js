var dbMan = require('./dbManager');
var config = require('./settings');
var fpManager = {}
fpManager.recaptcha = {}

fpManager.currentHash = '';
fpManager.fpOpen = false;
fpManager.ttNFp = new Date();
fpManager.fpCurrentWiningUser = '';

var milliseconds = 3600000;

var setupNextFpOpen = function(ircClient){
   var timeToNextFp = (Math.round(((Math.random() * 24)) * 1)/1) * milliseconds;//10000;
   //var timeToNextFp = (Math.round(((Math.random() * 24)) * 1)/1) * 90000;
   fpManager.fpOpen = false;
   setTimeout(function(){
        announceAndOpenFp(ircClient);      
   },timeToNextFp);
   fpManager.ttNFp = new Date(Date.now()+ timeToNextFp)
};

// Announce the fp to the channel 
var announceAndOpenFp = function(ircClient){
        console.log('[+] Anouncing new FP');
        fpManager.fpOpen = true;
        ircClient.say(config.IRC.channel,'FP is open go for it');
};

//Record the user that won the fp
var userHasWon = function(userName){
    console.log('[+] '+userName+' has won the fp');
    dbMan.fpResultsModel.findOne({'user':userName},function(err,user){
           if(err){
                console.log(err); 
           }else{
                if(user){
                     console.log('[-] Found the user '+user);
                     user.wins += 1; 
                     user.save(function (err) {
                        if(err){
                            console.log(err);   
                        };
                        console.log('[-] User saved');
                     });
                     return user;
                }else{
                    console.log('[-] No user found');
                    var newUser = new dbMan.fpResultsModel();
                    newUser.user = userName;
                    newUser.wins = 1;
                    newUser.save(function (err) {
                       if(err){
                           console.log(err);   
                           return;
                       };
                       console.log('[-] User saved');
                    });
                } 
           }
    });
};

//Get the list of users that have won fp and anounce them to the channel
var getFpWinners = function(ircClient){
    console.log('loading the fpWinners');
    dbMan.fpResultsModel.find({},[],{'sort':[['wins':-1]]},function(err,users){
           if(err){
                console.log(err); 
           }else{
                console.log('[+] Found users :');
                if(users){
                    //Only list the top 5 winners
                    users.splice(0,5).forEach(function(user){
                        console.log('[-] User : '+user.user.toString()+' has won ' +user.wins.toString() + ' times' );
                        ircClient.say(config.IRC.channel,user.user.toString()+' has won ' +user.wins.toString() + ' times' );
                    }); 
                }; 
           };
    });
};


fpManager.userHasWon = userHasWon;
fpManager.getFpWinners  = getFpWinners;
fpManager.announceAndOpenFp = announceAndOpenFp;
fpManager.setupNextFpOpen = setupNextFpOpen;

module.exports = fpManager;
