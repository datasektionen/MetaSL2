var config = require('./config');
var express = require('express');
var app = express();
var server= require('http').Server(app);
var http = require('http');
var io = require('socket.io')(server);
var path = require('path');
require('./routes')(app);

//----------- public folder
app.use('/public', express.static(path.join(__dirname + '/public')));

//----------- SL OPTIONS
var sloptionsrealtid = {
	host: 'api.sl.se',
	path: '/api2/realtimedepartures.json?key=' + config.sl.realtidtoken + '&siteid=' + config.siteid + '&timewindow=60',
	method: 'GET'
};

//----------- stats
var stats = {
	latesttime:"",
	requests:0,
	failedrequests:0,
	nrofclients:0,
};

//----------- get stuff
var getstuff = function(options, callback) {
	stats.requests++;
	var req = http.request(options, function(res) {
		res.setEncoding('utf-8');

		var responseString = '';
		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			if (responseString) {
				try {
					var responseObject = JSON.parse(responseString);
					callback(responseObject);
				} catch(e) { 
					console.log("error: " + e);
					stats.failedrequests++;
				}
			}			
		});

		res.on('error', function(e) {
			stats.failedrequests++;
			console.log(e);
		});
	});
	req.end();
};

//-----------
var sldata = {};

//----------- IO
io.on('connection', function(socket) {
	stats.nrofclients = io.engine.clientsCount;	
	if (sldata.ResponseData) { //On upstart there will be no data here.
		socket.emit('slmetro', sldata.ResponseData.Metros);
		socket.emit('slbus', sldata.ResponseData.Buses);
		socket.emit('sltram', sldata.ResponseData.Trams);
		socket.emit('stats', stats);
	};
	socket.on('disconnect', function() {
		stats.nrofclients = io.engine.clientsCount;
	});
});

//-----------
var stuff = function(){
	getstuff(sloptionsrealtid, function(data) {
		sldata = data;
		//Update the latest succesfull requests time.
		if (sldata.ResponseData && sldata.ResponseData.LatestUpdate) {
			stats.latesttime = sldata.ResponseData.LatestUpdate;
		}
		io.emit('slmetro', sldata.ResponseData.Metros);
		io.emit('slbus', sldata.ResponseData.Buses);
		io.emit('sltram', sldata.ResponseData.Trams);
		io.emit('stats', stats);
	});
};

setInterval(stuff, 1000 * config.refreshrate); //Rereshrate is in seconds.
stuff();

process.on('uncaughtException', function globalErrorCatch(error, p) {
	console.error(error);
	console.error(error.stack);
});

//---------
server.listen(config.port, function(){
	console.log('listening on *:' + config.port);
});