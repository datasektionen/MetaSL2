var config = require('./config');
var app = require('express')();
var http = require('http').Server(app);
var xhttp = require('http');
var io = require('socket.io')(http);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});


//----------- SL STORNING
var realtidoptions = {
	host: 'api.sl.se',
	path: '/api2/realtimedepartures.json?key=' + config.sl.realtidtoken + '&siteid=9204&timewindow=60',
	method: 'GET'
};

var getstorning = function(callback) {
	var req = xhttp.request(realtidoptions, function(res) {
		res.setEncoding('utf-8');

		var responseString = '';
		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			console.log(responseString);
			var responseObject = JSON.parse(responseString);
			callback(responseObject);
		});

		res.on('error', function(e) {
			console.log(e);
		});
	});
	req.end();
};

getstorning(function(data) {
	console.log(data);
});

//----------- IO
io.on('connection', function(socket) {
	console.log('new connection');
	socket.on('disconnect', function() {
		console.log('connection closed');
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});