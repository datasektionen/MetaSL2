var config = {};

config.sl = {};
config.sl.realtidtoken = process.env.REALTIDTOKEN; //only stored in env
config.port = process.env.PORT || 5000;
config.refreshrate = {};
config.refreshrate.realtid = process.env.REALREFRESH || 30 ; //Number of seconds between refresh
config.siteid = process.env.SITEID || 9204; //Tekniska högskolan siteid

module.exports = config;
