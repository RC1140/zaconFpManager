var irc = require('irc');
var sys = require('sys');
var config = require('./settings');
var express  = require('express');
var Recaptcha = require('recaptcha').Recaptcha;
var mongoose = require('mongoose');
var hashlib = require('hashlib');
var app = express.createServer();
//One hour in milliseconds
var milliseconds = 3600000;

app.configure(function() {
    app.use(express.bodyParser());
});

var initialDisplayForUser = function(req, res) {
    if (req.params.hash == currentHash){
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
    if (req.params.hash == currentHash){
        var data = {
            remoteip:  req.connection.remoteAddress,
            challenge: req.body.recaptcha_challenge_field,
            response:  req.body.recaptcha_response_field
        };
        var recaptcha = new Recaptcha(config.recaptcha.PUBLIC_KEY, config.recaptcha.PRIVATE_KEY, data);

        recaptcha.verify(function(success, error_code) {
            if (success) {
               //If the user if valid , record a success for the name entered , or based on the url
               currentHash = '';
               res.send('You have won this FP , you are hopefully human thanks for helping');
               client.say('#jumpdeck',fpCurrentWiningUser +' has won the fp.');
               userHasWon(fpCurrentWiningUser);
               fpCurrentWiningUser = ''; 
               setupNextFpOpen();
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

app.post('/:hash', handleHumanVerification);
app.get('/:hash',initialDisplayForUser );

db = mongoose.connect(config.mongoserver);

mongoose.connection.on('open',function(){
        console.log('DB Connection Opened !!!');
});

var Schema = mongoose.Schema;

var fpResults = new Schema({
      user : String,
      wins : Number,
      losses : Number 
});

var fpResultsBase = mongoose.model('fpResults',fpResults);
var fpResultsModel = mongoose.model('fpResults');

var client = new irc.Client(config.IRC.server, 'fpm', {
    userName : 'fp Master',
    realName : 'Manager of the fp',
    autoRejoin : true,
    channels: [config.IRC.channel],
});
var currentHash = '';
var fpOpen = false;
var fpCurrentWiningUser = '';
var ttNFp = new Date();
var setupNextFpOpen = function(){
   var timeToNextFp = (Math.round(((Math.random() * 24)) * 1)/1) * 10000;// *milliseconds;
   setTimeout(function(){
        announceAndOpenFp();      
   },timeToNextFp);
   ttNFp = new Date(Date.now()+ timeToNextFp)
};
var announceAndOpenFp = function(){
        fpOpen = true;
        client.say('#jumpdeck','FP is open go for it');
};
//client.join('#jumpdeck',function(){ });
client.addListener('registered', function () {
       setupNextFpOpen();
});
client.addListener('message', function (from, to, message) {
    var fpCatch = /^([f][p])$/i
    if(fpOpen && message.match(fpCatch)){
        fpOpen = false;
        currentHash = hashlib.md5(Date.now().toString() + from);
        client.say(from,'http://localhost:3000/'+currentHash+'/');
        client.say('#jumpdeck',from +' has won the challenge , awaiting humanity challenge.');
        fpCurrentWiningUser = from;
        setTimeout(function(){
            currentHash = '';     
            fpCurrentWiningUser = '';
        },60000);
   }else{
        if (fpCurrentWiningUser != ''){
            client.say('#jumpdeck',fpCurrentWiningUser +' is is currently being verified.');
        }else{
            client.say('#jumpdeck','Next FP starts on : ' + ttNFp.toString() + ' seconds ');
        };
   }
});
var userHasWon = function(userName){
    fpResultsModel.findOne({'user':userName},function(err,user){
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
                    var newUser = new fpResultsModel();
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

client.addListener('pm', function (from, message) {
    if(message.toLowerCase().indexOf('all') === 0){
        capBase.find({},function(err,data){
            data.forEach(function(item,index){
                client.say(from,'URL : ' + item.url + ' From : '+ item.from);
            });
        });
    };
});

app.listen(3000);
