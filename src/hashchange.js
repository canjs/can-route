// Regular expression for identifying &amp;key=value lists.
var paramsMatcher = /^(?:&[^=]+=[^&]*)+/;

var LOCATION = require('can-globals/location/location');
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

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
			var  reasonLog = [];
			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				reasonLog = [ canReflect.getName(this), "changed to", this.value, "from", old ];
			}
			//!steal-remove-end
			
			
			queues.enqueueByQueue(this.handlers.getNode([]), this, [this.value, old]
				/* jshint laxcomma: true */
				, null
				, reasonLog
				/* jshint laxcomma: false */
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

var hashchangeObservableProto = {
	"can.getValue": HashchangeObservable.prototype.get,
	"can.setValue": HashchangeObservable.prototype.set,
	"can.onValue": HashchangeObservable.prototype.on,
	"can.offValue": HashchangeObservable.prototype.off,
	"can.isMapLike": false,
	"can.valueHasDependencies": function(){
		return true;
	}
};

//!steal-remove-start
if(process.env.NODE_ENV !== 'production') {
	hashchangeObservableProto[canSymbol.for("can.getName")] = function() {
		return "HashchangeObservable<" + this.value + ">";
	};
}
//!steal-remove-end

canReflect.assignSymbols(HashchangeObservable.prototype, hashchangeObservableProto);

module.exports = new HashchangeObservable();
