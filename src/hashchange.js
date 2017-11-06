// Regular expression for identifying &amp;key=value lists.
var paramsMatcher = /^(?:&[^=]+=[^&]*)+/;

var LOCATION = require('can-globals/location/location');
var canReflect = require("can-reflect");
var eventQueue = require("can-event-queue");

module.exports = canReflect.assignSymbols({
    paramsMatcher: paramsMatcher,
    querySeparator: "&",
    // don't greedily match slashes in routing rules
    matchSlashes: false,
    root: "#!"
},{
    "can.onValue": function(handler){
        eventQueue.on.call(window, 'hashchange', handler);
    },
    "can.offValue": function(handler) {
        eventQueue.on.call(window, 'hashchange', handler);
    },
    // Gets the part of the url we are determinging the route from.
    // For hashbased routing, it's everything after the #, for
    // pushState it's configurable
    "can.getValue": function() {
        var loc = LOCATION();
        return loc.href.split(/#!?/)[1] || "";
    },
    // gets called with the serializedcanRoute data after a route has changed
    // returns what the url has been updated to (for matching purposes)
    "can.setValue": function(path){
        var loc = LOCATION();
        if(loc.hash !== "#" + path) {
            loc.hash = "!" + path;
        }
        return path;
    }
});
