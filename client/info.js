var info = new Meteor.subscribe("info");

console.log(info.find().fetch())