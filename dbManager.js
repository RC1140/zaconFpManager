var mongoose = require('mongoose');
var config = require('./settings');

var dbManager = {}

var initCon = function(){
    db = mongoose.connect(config.mongoserver);
    mongoose.connection.on('open',function(){
            console.log('DB Connection Opened !!!');
    });
}();
var Schema = mongoose.Schema;

var fpResults = new Schema({
      user : String,
      wins : Number,
      losses : Number 
});

var fpResultsBase = mongoose.model('fpResults',fpResults);
var fpResultsModel = mongoose.model('fpResults');


dbManager.fpResultsBase = fpResultsBase;
dbManager.fpResultsModel = fpResultsModel;

module.exports = dbManager;
