var canRoute = require("can-route");
var SimpleObservable = require("can-simple-observable");

var routeValue = new SimpleObservable("");

canRoute.bindings.mock = {
	paramsMatcher: /^(?:&[^=]+=[^&]*)+/,
	querySeparator: "&",
	// don't greedily match slashes in routing rules
	matchSlashes: false,
	bind: function () {
		routeValue.on(canRoute.setState);
	},
	unbind: function () {
		routeValue.off(canRoute.setState);
	},
	// Gets the part of the url we are determinging the route from.
	// For hashbased routing, it's everything after the #, for
	// pushState it's configurable
	matchingPartOfURL: function () {
		return routeValue.get().split(/#!?/)[1] || "";
	},
	// gets called with the serializedcanRoute data after a route has changed
	// returns what the url has been updated to (for matching purposes)
	setURL: function (path) {
		if(path[0] !== "#") {
			routeValue.set("#"+(path || ""));
		} else {
			routeValue.set(path || "");
		}
		return path;
	},
	root: "#!"
};

var oldDefault;

module.exports = {
	start: function(){
		oldDefault = canRoute.defaultBinding;
		canRoute._teardown();
		canRoute.currentBinding = null;
		canRoute.defaultBinding = "mock";
		routeValue.set("");
		//canRoute._setup();
	},
	stop: function(){
		canRoute._teardown();
		canRoute.defaultBinding = oldDefault;
		//canRoute.bindings.mock.unbind();
		//canRoute._setup();
	},
	hash: routeValue
};
