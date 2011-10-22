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
           client.say(config.IRC.channel,'Next FP starts at : ' + fpManager.ttNFp.toString() );
           },10000);
       formManager.loadAndInit(client);
        fpManager.fpOpen = true;
});

var usersBeingValidated = [];
var validateNickRegistration = function(nickname) {
        client.say('nickserv', 'status ' + nickname);
        usersBeingValidated.push(nickname);	
};

client.addListener('raw', function (message) {
        if (message.args.length == 2)
        {
            var messageParams = message.args[1].split(' ');
            if (messageParams.length == 3 &&
                message.command == 'NOTICE' && 
                usersBeingValidated.length != 0 && 
                usersBeingValidated.indexOf(messageParams[1]) != -1)  
               {        
                    if (messageParams[2] == '3' && fpManager.fpOpen)
                    {
                        delete usersBeingValidated[usersBeingValidated.indexOf(messageParams[1])];
                        fpManager.fpOpen = false;
                        fpManager.currentHash = hashlib.md5(Date.now().toString() + messageParams[1]);
                        client.say( messageParams[1],config.hostingURL+fpManager.currentHash+'/');
                        client.say(config.IRC.channel,messageParams[1] +' has won the challenge , awaiting humanity challenge.');
                        fpManager.fpCurrentWiningUser = messageParams[1];
                        setTimeout(function(){
                            if(fpManager.currentHash != ''){
                                client.say(config.IRC.channel,fpManager.fpCurrentWiningUser +' has lost the challenge, better luck next time.');
                                fpManager.currentHash = '';     
                                fpManager.fpCurrentWiningUser = '';
                                fpManager.setupNextFpOpen(client);
                            }
                        },60000); 
                    } else {
                            if (!fpManager.fpOpen)
                            {
                                client.say(config.IRC.channel,fpManager.fpCurrentWiningUser +' is currently being verified.');
                                delete usersBeingValidated[usersBeingValidated.indexOf(messageParams[1])];
                            } else {
                                client.say(usersBeingValidated, 'Your nick must be validated with Nickserv.');
                                delete usersBeingValidated[usersBeingValidated.indexOf(messageParams[1])];
                            }
                    }
               }
        }
});

client.addListener('message', function (from, to, message) {
    var fpCatch = /^fp$/i
    if(fpManager.fpOpen && message.match(fpCatch)){
        validateNickRegistration(from);
    }else{
        if (fpManager.fpCurrentWiningUser != '' && message.match(fpCatch)){
            client.say(config.IRC.channel,fpManager.fpCurrentWiningUser +' is currently being verified.');
        }else if(message.match(fpCatch)){
            client.say(config.IRC.channel,'Next FP starts at : ' + fpManager.ttNFp.toString());
        };
   }
});

