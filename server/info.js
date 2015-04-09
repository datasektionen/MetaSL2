var metro = new Mongo.Collection("metro")
var bus = new Mongo.Collection("bus")
var tram = new Mongo.Collection("tram")


var url = "http://api.sl.se/api2/realtimedepartures.json?key=01faef2ce14d480db2f0b5e52bed7fbc&siteid=9204&timewindow=60"
Meteor.http.get(url, function(a, data) {
	[metro, tram, bus].forEach(function(collection) {
		collection.remove({})
		var rd = JSON.parse(data.content).ResponseData
		rd.Metros.forEach(function(m) {
			collection.insert(m)
		})
	})
})