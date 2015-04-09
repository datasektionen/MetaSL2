metro = new Mongo.Collection("metro")
bus = new Mongo.Collection("bus")
tram = new Mongo.Collection("tram")

Meteor.subscribe("metro")
Meteor.subscribe("bus")
Meteor.subscribe("tram")

Router.route('/metro', function () {
  this.render('metro');
})

Router.route('/bus', function () {
  this.render('bus');
})

Router.route('/tram', function () {
  this.render('tram');
})