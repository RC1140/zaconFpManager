var irc = require('irc');
var config = require('./settings');
var fpManager = require('./fpManager');
var formManager = require('./formManager');
var hashlib = require('hashlib');

var client = new irc.Client(config.IRC.server, 'fpm', {
    userName : 'fp Master',
    realName : 'Manager of the fp',
    autoRejoin : true,
    channels: [config.IRC.channel],
});

client.addListener('registered', function () {
       fpManager.setupNextFpOpen(client);
       setTimeout(function(){
           client.say('#jumpdeck','Next FP starts at : ' + fpManager.ttNFp.toString() + ' seconds ');
           },10000);
       formManager.loadAndInit(client);
});

client.addListener('message', function (from, to, message) {
    var fpCatch = /^([f][p])$/i
    if(fpManager.fpOpen && message.match(fpCatch)){
        fpManager.fpOpen = false;
        fpManager.currentHash = hashlib.md5(Date.now().toString() + from);
        client.say(from,'http://localhost:3000/'+fpManager.currentHash+'/');
        client.say('#jumpdeck',from +' has won the challenge , awaiting humanity challenge.');
        fpManager.fpCurrentWiningUser = from;
        setTimeout(function(){
            if(fpManager.currentHash != ''){
                client.say('#jumpdeck',fpManager.fpCurrentWiningUser +' has lost the challenge, better luck next time.');
                fpManager.currentHash = '';     
                fpManager.fpCurrentWiningUser = '';
                fpMan.setupNextFpOpen(client);
            }
        },60000);
   }else{
        if (fpManager.fpCurrentWiningUser != '' && message.match(fpCatch)){
            client.say('#jumpdeck',fpManager.fpCurrentWiningUser +' is is currently being verified.');
        }else if(message.match(fpCatch)){
            client.say('#jumpdeck','Next FP starts at : ' + fpManager.ttNFp.toString() + ' seconds ');
        };
   }
});

