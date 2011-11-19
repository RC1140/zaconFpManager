var app = express.createServer();
var Recaptcha = require('recaptcha').Recaptcha;
var config = require('./settings');
var fpMan = require('./fpManager');

var formManager = {}
var client;

app.configure(function() {
    app.use(express.bodyParser());
});

var initialDisplayForUser = function(req, res) {
    if (req.params.hash == fpMan.currentHash){
        var recaptcha = new Recaptcha(config.recaptcha.PUBLIC_KEY, config.recaptcha.PRIVATE_KEY);

        res.render('form.jade', {
            layout: false,
            locals: {
                recaptcha_form: recaptcha.toHTML()
            }
        });
    }else{
       res.send('Invalid URL or timeout expired'); 
    };
};

var handleHumanVerification = function(req, res) {
    if (req.params.hash == fpMan.currentHash){
        var data = {
            remoteip:  req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response:  req.body.recaptcha_response_field
        };
        var recaptcha = new Recaptcha(config.recaptcha.PUBLIC_KEY, config.recaptcha.PRIVATE_KEY, data);

        recaptcha.verify(function(success, error_code) {
            if (success) {
               //If the user if valid , record a success for the name entered , or based on the url
               fpMan.currentHash = '';
               res.send('You have won this FP , you are hopefully human thanks for helping');
               client.say(config.IRC.channel,fpMan.fpCurrentWiningUser +' has won the fp.');
               fpMan.userHasWon(fpMan.fpCurrentWiningUser);
               fpMan.fpCurrentWiningUser = ''; 
               fpMan.setupNextFpOpen(client);
            }
            else {
                // Redisplay the form.
                res.render('form.jade', {
                    layout: false,
                    locals: {
                        recaptcha_form: recaptcha.toHTML()
                    }
                });
            }
        });
    }else{
       res.send('Invalid URL or timeout expired'); 
    };
};

formManager.loadAndInit = function(ircClient){
    client = ircClient;
    //Setup the url handles and start listening
    app.post('/:hash', handleHumanVerification);
    app.get('/:hash',initialDisplayForUser );
    app.listen(8080);
};

module.exports = formManager;
