/*jshint -W079 */
var queues = require("can-queues");
var Observation = require('can-observation');
var SimpleObservable = require("can-simple-observable");

var namespace = require('can-namespace');

var each = require('can-util/js/each/each');
var isFunction = require('can-util/js/is-function/is-function');
var isWebWorker =  require('can-util/js/is-web-worker/is-web-worker');
var isBrowserWindow =  require('can-util/js/is-browser-window/is-browser-window');
var assign = require("can-util/js/assign/assign");
var dev = require('can-util/js/dev/dev');
var canReflect = require('can-reflect');
var canSymbol = require('can-symbol');
var makeCompute = require("can-simple-observable/make-compute/make-compute");
var SimpleMap = require("can-simple-map");

var registerRoute = require("./src/register");
var urlDispatcher = require("./src/-url-dispatcher");
var urlHelpers = require("./src/url-helpers");
var routeParam = require("./src/param");
var routeDeparam = require("./src/deparam");
var bindingProxy = require("./src/binding-proxy");
var hashchange = require("./src/hashchange");

bindingProxy.bindings.hashchange = hashchange;
bindingProxy.defaultBinding = "hashchange";

// ## route.js
// `can-route`
// _Helps manage browser history (and client state) by synchronizing the
// `window.location.hash` with a `Map`._

function canRoute(url, defaults){
	registerRoute.register(url, defaults);
	return canRoute;
}

//
// Helper methods used for matching routes.




var attrHelper = function (prop, value) {
	if("attr" in this) {
		return this.attr.apply(this, arguments);
	} else {
		if(arguments.length > 1) {
			canReflect.setKeyValue(this, prop, value);
			return this;
		} else if(typeof prop === 'object') {
			canReflect.assignDeep(this,prop);
			return this;
		} else if(arguments.length === 1){
			return canReflect.getKeyValue(this, prop);
		} else {
			return canReflect.unwrap(this);
		}
	}

};

// Helper for convert any object (or value) to stringified object (or value)
var stringify = function (obj) {
	// Object is array, plain object, Map or List
	if (obj && typeof obj === "object") {
		if (obj && typeof obj === "object" && ("serialize" in obj)) {
			obj = obj.serialize();
		} else {
			// Get array from array-like or shallow-copy object
			obj = isFunction(obj.slice) ? obj.slice() : assign({}, obj);
		}
		// Convert each object property or array item into stringified new
		each(obj, function (val, prop) {
			obj[prop] = stringify(val);
		});
		// Object supports toString function
	} else if (obj !== undefined && obj !== null && isFunction(obj.toString)) {
		obj = obj.toString();
	}

	return obj;
};



// A ~~throttled~~ debounced function called multiple times will only fire once the
// timer runs down. Each call resets the timer.
var timer;
// Intermediate storage for `canRoute.data`.
var curParams;
// The last hash caused by a data change
var lastHash;
// Are data changes pending that haven't yet updated the hash
var changingData;
// List of attributes that have changed since last update
var changedAttrs = [];
// A dummy events object used to dispatch url change events on.




// If the `route.data` changes, update the hash.
// Using `.serialize()` retrieves the raw data contained in the `observable`.
// This function is ~~throttled~~ debounced so it only updates once even if multiple values changed.
// This might be able to use batchNum and avoid this.
var oldProperties = null;
var onRouteDataChange = function (ev, newProps, oldProps) {
	// indicate that data is changing
	changingData = 1;
	// collect attributes that are changing
	if(!oldProperties) {
		oldProperties = oldProps;
	}
	clearTimeout(timer);
	timer = setTimeout(function () {
		var old = oldProperties;
		oldProperties = null;
		// indicate that the hash is set to look like the data
		changingData = 0;
		var serialized =canRoute.data.serialize(),
			route = routeParam.getMatchedRoute(serialized),
			path = routeParam.paramFromRoute(route, serialized);

		if(route) {
			// if we are paraming for setting the hash
	        // we also want to make sure the route value is updated
			// TODO: matched can almost certainly be an observation around the route derived from the serialize data
			canRoute.matched(route.route);
		}
		bindingProxy.call("can.setValue", path, newProps, old);
		//canRoute._call("setURL", path, newProps, old);
		// trigger a url change so its possible to live-bind on url-based changes
		urlDispatcher.dispatch("__url",[path, lastHash]);
		lastHash = path;
		changedAttrs = [];
	}, 10);
};

// everything in the backing Map is a string
// add type coercion during Map setter to coerce all values to strings
var stringCoercingMapDecorator = function(map) {
	var sym = canSymbol.for("can.route.stringCoercingMapDecorator");
	if(!map.attr[sym]) {
		var attrSuper = map.attr;

		map.attr = function(prop, val) {
			var serializable = this.define === undefined || this.define[prop] === undefined || !!this.define[prop].serialize,
				args;

			if (serializable) { // if setting non-str non-num attr
				args = stringify(Array.apply(null, arguments));
			} else {
				args = arguments;
			}

			return attrSuper.apply(this, args);
		};
		canReflect.setKeyValue(map.attr, sym, true);
	}

	return map;
};

var recursiveClean = function(old, cur, data){
	for(var attr in old){
		if(cur[attr] === undefined){
			if("removeAttr" in data) {
				data.removeAttr(attr);
			} else {
				cur[attr] = undefined;
			}

		}
		else if(Object.prototype.toString.call(old[attr]) === "[object Object]") {
			recursiveClean( old[attr], cur[attr], attrHelper.call(data,attr) );
		}
	}
};



var // Deparameterizes the portion of the hash of interest and assign the
// values to the `route.data` removing existing values no longer in the hash.
// setState is called typically by hashchange which fires asynchronously
// So it's possible that someone started changing the data before the
// hashchange event fired.  For this reason, it will not set the route data
// if the data is changing or the hash already matches the hash that was set.
setState =canRoute.setState = function () {
	var hash =bindingProxy.call("can.getValue");
	var oldParams = curParams;
	curParams =canRoute.deparam(hash);
	var matched;

	// if the hash data is currently changing, or
	// the hash is what we set it to anyway, do NOT change the hash
	if (!changingData || hash !== lastHash) {
		queues.batch.start();
		recursiveClean(oldParams, curParams,canRoute.data);

		matched = curParams.route;
		delete curParams.route;
		canRoute.matched(matched);
		canRoute.attr(curParams);
		curParams.route = matched;
		// trigger a url change so its possible to live-bind on url-based changes
		urlDispatcher.dispatch("__url",[hash, lastHash]);
		queues.batch.stop();
	}
};



var matchedObservable = new SimpleObservable();

/**
 * @static
 */

Object.defineProperty(canRoute,"routes",{
	/**
	 * @property {Object} routes
	 * @hide
	 *
	 * A list of routes recognized by the router indixed by the url used to add it.
	 * Each route is an object with these members:
	 *
	 *  - test - A regular expression that will match the route when variable values
	 *    are present; i.e. for {page}/{type} the `RegExp` is /([\w\.]*)/([\w\.]*)/ which
	 *    will match for any value of {page} and {type} (word chars or period).
	 *
	 *  - route - The original URL, same as the index for this entry in routes.
	 *
	 *  - names - An array of all the variable names in this route
	 *
	 *  - defaults - Default values provided for the variables or an empty object.
	 *
	 *  - length - The number of parts in the URL separated by '/'.
	 */
 	get: function() {
 		return registerRoute.routes
 	},
	set: function(newVal) {
		return registerRoute.routes = newVal;
	}
});
Object.defineProperty(canRoute,"defaultBinding",{
 	get: function(){
		return bindingProxy.defaultBinding
	},
	set: function(newVal){
		bindingProxy.defaultBinding = newVal;
	}
});
Object.defineProperty(canRoute,"currentBinding",{
 	get: function(){
		return bindingProxy.currentBinding;
	},
	set: function(newVal){
	bindingProxy.currentBinding = newVal;
	}
});

assign(canRoute, {
	param: routeParam,
	deparam: routeDeparam,
	map: function(data){
		//!steal-remove-start
		dev.warn('Set route.data directly instead of calling route.map');
		//!steal-remove-end
		canRoute.data = data;
	},

	/**
	 * @function can-route.ready ready
	 * @parent can-route.static
	 *
	 * Initializes can-route.
	 *
	 * @signature `route.ready()`
	 *
	 * Sets up the two-way binding between the hash and the can-route observable
	 * map and sets the route map to its initial values.
	 *
	 * ```js
	 * route("{page}", { page: "home" }));
	 *
	 * route.ready();
	 * route.data.page; // -> "home"
	 * ```
	 *
	 * @return {can-route} The can-route object.
	 *
	 * @body
	 *
	 * ## Use
	 *
	 * After setting all your routes, call `route.ready()`.
	 *
	 * ```js
	 * route("overview/{dateStart}-{dateEnd}");
	 * route("{type}/{id}");
	 * route.ready();
	 * ```
	 */
	ready: function (val) {
		if (val !== true) {
			canRoute._setup();
			if(isBrowserWindow() || isWebWorker()) {
				canRoute.setState();
			}
		}
		return canRoute;
	},
	url: urlHelpers.url,
	link: urlHelpers.link,
	current: urlHelpers.current,
	bindings: bindingProxy.bindings,

	// ready calls setup
	// setup binds and listens to data changes
	// bind listens to whatever you should be listening to
	// data changes tries to set the path

	// we need to be able to
	// easily kick off calling setState
	// 	teardown whatever is there
	//  turn on a particular binding

	// called when the route is ready
	_setup: function () {
		if (!canRoute.currentBinding) {
			bindingProxy.call("can.onValue", setState);
			canReflect.onValue( canRoute.serializedObservation, onRouteDataChange, "notify");
			canRoute.currentBinding =canRoute.defaultBinding;
		}
	},
	_teardown: function () {
		if (canRoute.currentBinding) {
			bindingProxy.call("can.offValue", setState);
			canReflect.offValue( canRoute.serializedObservation, onRouteDataChange, "notify");
			canRoute.currentBinding = null;
		}
		clearTimeout(timer);
		changingData = 0;
	},
	/**
	 * @function can-route.matched matched
	 * @parent can-route.static
	 * @description A compute representing the currently matched route.
	 * @signature `route.matched()`
	 * @return {String} The currently matched route.
	 *
	 * @body
	 * Use `route.matched()` to find the currently matched route.
	 *
	 * ```js
	 * route("{type}", { type: "foo" });
	 * route("{type}/{subtype}");
	 *
	 * route.matched(); // "{type}"
	 *
	 * route.data.subtype = "foo";
	 *
	 * route.matched(); // "{type}/{subtype}"
	 * ```
	 */
	matched: makeCompute( matchedObservable )
});

// The functions in the following list applied to `canRoute` (e.g. `canRoute.attr('...')`) will
// instead act on the `canRoute.data` observe.

var bindToCanRouteData = function(name, args) {
	if (!canRoute.data[name]) {
		return canRoute.data.addEventListener.apply(canRoute.data, args);
	}
	return canRoute.data[name].apply(canRoute.data, args);
};

each(['addEventListener','removeEventListener','bind', 'unbind', 'on', 'off'], function(name) {
	// exposing all internal eventQueue evt's to canRoute
	canRoute[name] = function(eventName) {
		if (eventName === '__url') {
			return urlDispatcher[name].apply(urlDispatcher, arguments);
		}
		return bindToCanRouteData(name, arguments);
	};
});

each(['delegate', 'undelegate', 'removeAttr', 'compute', '_get', '___get', 'each'], function (name) {
	canRoute[name] = function () {
		// `delegate` and `undelegate` require
		// the `can/map/delegate` plugin
		return bindToCanRouteData(name, arguments);
	};
});


var routeData;
var setRouteData = function(data){
	routeData = data;
	return routeData;
};
var serializedObservation;
var serializedCompute;

Object.defineProperty(canRoute,"serializedObservation", {
	get: function(){
		if(!serializedObservation) {
			serializedObservation = new Observation(function canRouteSerialized(){
				return canReflect.serialize( canRoute.data );
			});
		}
		return serializedObservation;
	}
});
Object.defineProperty(canRoute,"serializedCompute", {
	get: function(){
		if(!serializedCompute) {
			serializedCompute = makeCompute(canRoute.serializedObservation);
		}
		return serializedCompute;
	}
});
Object.defineProperty(canRoute,"data", {
	get: function(){
		if(routeData) {
			return routeData;
		} else {
			return setRouteData( stringCoercingMapDecorator( new SimpleMap() ) );
		}
	},
	set: function(data) {
		if( canReflect.isConstructorLike(data) ){
			data = new data();
		}
		// if it's a map, we make it always set strings for backwards compat
		if( "attr" in data ) {
			setRouteData( stringCoercingMapDecorator(data) );
		} else {
			setRouteData(data);
		}
	}
});

canRoute.attr = function(){
	return attrHelper.apply(canRoute.data,arguments);
};


canReflect.setKeyValue(canRoute, canSymbol.for("can.isFunctionLike"), false);

module.exports = namespace.route = canRoute;
