var config = require('./config');
var app = require('express')();
var http = require('http').Server(app);
var xhttp = require('http');
var io = require('socket.io')(http);
require('./routes')(app);

//----------- SL OPTIONS
var sloptionsrealtid = {
	host: 'api.sl.se',
	path: '/api2/realtimedepartures.json?key=' + config.sl.realtidtoken + '&siteid=9204&timewindow=60',
	method: 'GET'
};

//----------- get stuff
var getstuff = function(options, callback) {
	var req = xhttp.request(options, function(res) {
		res.setEncoding('utf-8');

		var responseString = '';
		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			var responseObject = JSON.parse(responseString);
			callback(responseObject);
		});

		res.on('error', function(e) {
			console.log(e);
		});
	});
	req.end();
};

//----------- IO
io.on('connection', function(socket) {
	console.log('new connection');
	socket.on('disconnect', function() {
		console.log('connection closed');
	});
});

//-----------
var stuff = function(){
	getstuff(sloptionsrealtid, function(data) {
		io.emit('slmetro', data.ResponseData.Metros);
		io.emit('slbus', data.ResponseData.Buses);
		io.emit('sltram', data.ResponseData.Trams);
	});
};

var SECONDS_BETWEEN_REFRESH = 60;
setInterval(stuff, 1000 * SECONDS_BETWEEN_REFRESH);
stuff();

//---------
http.listen(3000, function(){
	console.log('listening on *:3000');
});