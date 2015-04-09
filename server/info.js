var metro = new Mongo.Collection("metro")
var bus = new Mongo.Collection("bus")
var tram = new Mongo.Collection("tram")


var url = "http://api.sl.se/api2/realtimedepartures.json?key=&siteid=9204&timewindow=60"
Meteor.http.get(url, function(a, data) {
	metro.remove({})
	tram.remove({})
	bus.remove({})
	var rd = JSON.parse(data.content).ResponseData
	metro.insert(rd.Metros)
	bus.insert(rd.Buses)
	tram.insert(rd.Trams)
	console.log(metro.find({}).fetch())
	console.log(tram.find({}).fetch())
	console.log(bus.find({}).fetch())
})