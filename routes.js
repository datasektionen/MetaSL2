module.exports = function(app) {
	app.get('/', function(req, res) {
		res.sendFile(__dirname + '/views/index.html');
	});

	app.get('/metro', function(req, res) {
		res.sendFile(__dirname + '/views/metro.html')
	});

	app.get('/tram', function(req, res) {
		res.sendFile(__dirname + '/views/tram.html');
	});

	app.get('/bus', function(req, res) {
		res.sendFile(__dirname + '/views/bus.html');
	});
};