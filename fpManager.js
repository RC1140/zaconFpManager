var dbMan = require('./dbManager');
var fpManager = {}
fpManager.recaptcha = {}

fpManager.currentHash = '';
fpManager.fpOpen = false;
fpManager.ttNFp = new Date();
fpManager.fpCurrentWiningUser = '';

var milliseconds = 3600000;

var setupNextFpOpen = function(ircClient){
   var timeToNextFp = (Math.round(((Math.random() * 24)) * 1)/1) * 10000;// *milliseconds;
   fpManager.fpOpen = false;
   setTimeout(function(){
        announceAndOpenFp(ircClient);      
   },timeToNextFp);
   fpManager.ttNFp = new Date(Date.now()+ timeToNextFp)
};

var announceAndOpenFp = function(ircClient){
        fpManager.fpOpen = true;
        ircClient.say('#jumpdeck','FP is open go for it');
};

var userHasWon = function(userName){
    dbMan.fpResultsModel.findOne({'user':userName},function(err,user){
           if(err){
                console.log(err); 
           }else{
                if(user){
                     user.wins += 1; 
                     user.save(function (err) {
                        if(err){
                            console.log(err);   
                        };
                     });
                     return user;
                }else{
                    var newUser = new dbMan.fpResultsModel();
                    newUser.user = userName;
                    newUser.wins = 1;
                    newUser.save(function (err) {
                       if(err){
                           console.log(err);   
                       };
                    });
                } 
           }
    });
};

fpManager.userHasWon = userHasWon;
fpManager.announceAndOpenFp = announceAndOpenFp;
fpManager.setupNextFpOpen = setupNextFpOpen;

module.exports = fpManager;
