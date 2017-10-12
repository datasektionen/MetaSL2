var config = require('./config');
var express = require('express');
var app = express();
var server= require('http').Server(app);
var http = require('http');
var io = require('socket.io')(server);
var path = require('path');
var request = require('request');
require('./routes')(app);

//----------- public folder
app.use('/public', express.static(path.join(__dirname + '/public')));

//----------- SL OPTIONS
var sloptionsrealtid = {
    uri: 'http://api.sl.se/api2/realtimedeparturesV4.json?key=' + config.sl.realtidtoken + '&siteid=' + config.siteid + '&timewindow=60',
    method: 'GET'
};

//----------- stats
var stats = {
    latesttime:"",
    requests:0,
    nrofclients:0,
};

//----------- get stuff
var getstuff = function(options, callback) {
    stats.requests++;
    request(options, function (error, response, body) {
        if(error) console.log('error:', error); 
        //Only do things if the response is the expected json response
        if (body && response.headers['content-type'].includes('application/json')) {
            try {
                var responseObject = JSON.parse(body);
            } catch(e) {
                console.log("response:" + body);
                console.log("error: " + e);
                console.log(e.stack);
            }
            callback(responseObject);
        } else {
            console.log("Error: not json data");
        }
    });
};

//-----------
var sldata = {};
var sltraffic = {};

//----------- IO
io.on('connection', function(socket) {
    stats.nrofclients = io.engine.clientsCount; 
    if (sldata.ResponseData) { //On upstart there will be no data here.
        socket.emit('slmetro', sldata.ResponseData.Metros);
        socket.emit('slbus', sldata.ResponseData.Buses);
        socket.emit('sltram', sldata.ResponseData.Trams);
        socket.emit('stats', stats);
        //socket.emit('sltrafficinfo', sltraffic);
    };
    socket.on('disconnect', function() {
        stats.nrofclients = io.engine.clientsCount;
    });
});

//----------- Realtid
var getRealtime = function(){
    getstuff(sloptionsrealtid, function(data) {
        //Update the latest succesfull requests time.
        if (data.ResponseData && data.ResponseData.LatestUpdate
            && !data.ResponseData.LatestUpdate.includes('1970')) {
            stats.latesttime = data.ResponseData.LatestUpdate;
            sldata = data;
            io.emit('slmetro', sldata.ResponseData.Metros);
            io.emit('slbus', sldata.ResponseData.Buses);
            io.emit('sltram', sldata.ResponseData.Trams);
            io.emit('stats', stats);
        } else {
            console.log("some error with the data");
        }
    });
};

setInterval(getRealtime, 1000 * config.refreshrate.realtid); //Refreshrate is in seconds.
getRealtime();

process.on('uncaughtException', function globalErrorCatch(error, p) {
    console.error(error);
    console.error(error.stack);
});

//---------
server.listen(config.port, function(){
    console.log('listening on *:' + config.port);
});