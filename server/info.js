var metro = new Mongo.Collection("metro")
var bus = new Mongo.Collection("bus")
var tram = new Mongo.Collection("tram")

var MINUTES_BETWEEN_REFRESH = 15
var url = "http://api.sl.se/api2/realtimedepartures.json?key=" + Meteor.settings.slRealtidToken + "&siteid=9204&timewindow=60"
function refresh() {
	Meteor.http.get(url, function(a, data) {
		[metro, tram, bus].forEach(function(collection) {
			var rd = JSON.parse(data.content).ResponseData
			collection.remove({})
			rd.Metros.reverse().forEach(function(m) {
				collection.insert(m)
			})
		})
	})
}
setInterval(refresh, 1000 * 60 * MINUTES_BETWEEN_REFRESH)
refresh()
