var canRoute = require("can-route");
var SimpleObservable = require("can-simple-observable");
var SimpleMap = require("can-simple-map");
var canReflect = require("can-reflect");
var routeValue;

canRoute.bindings.mock = canReflect.assignSymbols({
    paramsMatcher: /^(?:&[^=]+=[^&]*)+/,
    querySeparator: "&",
    // don't greedily match slashes in routing rules
    matchSlashes: false,
    root: "#!"
},{
    "can.onValue": function(handler){
        routeValue.on(handler);
    },
    "can.offValue": function(handler) {
        routeValue.off(handler);
    },
    // Gets the part of the url we are determinging the route from.
    // For hashbased routing, it's everything after the #, for
    // pushState it's configurable
    "can.getValue": function() {
        return routeValue.get().split(/#!?/)[1] || "";
    },
    // gets called with the serializedcanRoute data after a route has changed
    // returns what the url has been updated to (for matching purposes)
    "can.setValue": function(path){
		if(path[0] !== "#") {
			routeValue.set("#"+(path || ""));
		} else {
			routeValue.set(path || "");
		}
		return path;
    }
});

var oldDefault;

module.exports = {
	start: function(){
		// discard old hash
		this.hash = routeValue = new SimpleObservable("");
		oldDefault = canRoute.defaultBinding;
		canRoute._teardown();
		canRoute.currentBinding = null;
		canRoute.defaultBinding = "mock";
		routeValue.set("");
		canRoute.data = new SimpleMap();
		//canRoute._setup();
	},
	stop: function(){
		canRoute._teardown();
		canRoute.defaultBinding = oldDefault;
		this.hash = routeValue = new SimpleObservable("");
		canRoute.data = new SimpleMap();
		//canRoute.bindings.mock.unbind();
		//canRoute._setup();
	},
	hash: routeValue
};
