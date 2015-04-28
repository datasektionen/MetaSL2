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
	path: '/api2/realtimedepartures.json?key=' + config.sl.realtidtoken + '&siteid=9204&timewindow=60',
	method: 'GET'
};

//----------- get stuff
var getstuff = function(options, callback) {
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
				} catch(e) {}
			}			
		});

		res.on('error', function(e) {
			console.log(e);
		});
	});
	req.end();
};

//-----------
var sldata = {}
//----------- IO
io.on('connection', function(socket) {
	console.log('New connection, we have ' + io.engine.clientsCount + " connected users");
	if (sldata.ResponseData) { //On upstart there will be no data here.
		socket.emit('slmetro', sldata.ResponseData.Metros);
		socket.emit('slbus', sldata.ResponseData.Buses);
		socket.emit('sltram', sldata.ResponseData.Trams);
	};
	socket.on('disconnect', function() {
		console.log('connection closed, we have ' + io.engine.clientsCount + " connected users");
	});
});

//-----------
var stuff = function(){
	getstuff(sloptionsrealtid, function(data) {
		sldata = data;
		io.emit('slmetro', sldata.ResponseData.Metros);
		io.emit('slbus', sldata.ResponseData.Buses);
		io.emit('sltram', sldata.ResponseData.Trams);
	});
};

var SECONDS_BETWEEN_REFRESH = 60;
setInterval(stuff, 1000 * SECONDS_BETWEEN_REFRESH);
stuff();

//---------
server.listen(config.port, function(){
	console.log('listening on *:' + config.port);
});