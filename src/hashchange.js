// Regular expression for identifying &amp;key=value lists.
var paramsMatcher = /^(?:&[^=]+=[^&]*)+/;

var LOCATION = require('can-globals/location/location');
var canReflect = require("can-reflect");

var ObservationRecorder = require("can-observation-recorder");
var queues = require("can-queues");
var KeyTree = require("can-key-tree");
var SimpleObservable = require("can-simple-observable");

var domEvents = require("can-dom-events");

function getHash(){
    var loc = LOCATION();
    return loc.href.split(/#!?/)[1] || "";
}

function HashchangeObservable() {
    var dispatchHandlers =  this.dispatchHandlers.bind(this);
    var self = this;
    this.handlers = new KeyTree([Object,Array],{
        onFirst: function(){
            self.value = getHash();
            domEvents.addEventListener(window, 'hashchange', dispatchHandlers);
        },
        onEmpty: function(){
            domEvents.removeEventListener(window, 'hashchange', dispatchHandlers);
        }
    });
}
HashchangeObservable.prototype = Object.create(SimpleObservable.prototype);
HashchangeObservable.constructor = HashchangeObservable;
canReflect.assign(HashchangeObservable.prototype,{
    // STUFF NEEDED FOR can-route integration
    paramsMatcher: paramsMatcher,
    querySeparator: "&",
    // don't greedily match slashes in routing rules
    matchSlashes: false,
    root: "#!",
    dispatchHandlers: function() {
        var old = this.value;
        this.value = getHash();
        if(old !== this.value) {
            queues.enqueueByQueue(this.handlers.getNode([]), this, [this.value, old]
                //!steal-remove-start
                /* jshint laxcomma: true */
                , null
                , [ canReflect.getName(this), "changed to", this.value, "from", old ]
                /* jshint laxcomma: false */
                //!steal-remove-end
            );
        }
    },
    get: function(){
        ObservationRecorder.add(this);
        return getHash();
    },
    set: function(path){
        var loc = LOCATION();
        if(!path && !loc.path) {

        } else if(loc.hash !== "#" + path) {
            loc.hash = "!" + path;
        }
        return path;
    }
});

canReflect.assignSymbols(HashchangeObservable.prototype,{
	"can.getValue": HashchangeObservable.prototype.get,
	"can.setValue": HashchangeObservable.prototype.set,
	"can.onValue": HashchangeObservable.prototype.on,
	"can.offValue": HashchangeObservable.prototype.off,
	"can.isMapLike": false,
	"can.valueHasDependencies": function(){
		return true;
	},
	//!steal-remove-start
	"can.getName": function() {
		return "HashchangeObservable<" + this.value + ">";
	},
	//!steal-remove-end
});

module.exports = new HashchangeObservable();
