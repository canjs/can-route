/*jshint -W079 */
var canBatch = require('can-event/batch/batch');
var canEvent = require('can-event');
var Observation = require('can-observation');
var compute = require('can-compute');

var namespace = require('can-namespace');
var param = require('can-param');
var deparam = require('can-deparam');
var each = require('can-util/js/each/each');
var string = require('can-util/js/string/string');
var isFunction = require('can-util/js/is-function/is-function');
var isEmptyObject = require('can-util/js/is-empty-object/is-empty-object');
var deepAssign = require('can-util/js/deep-assign/deep-assign');
var isWebWorker =  require('can-util/js/is-web-worker/is-web-worker');
var isBrowserWindow =  require('can-util/js/is-browser-window/is-browser-window');
var makeArray = require('can-util/js/make-array/make-array');
var assign = require("can-util/js/assign/assign");
var types = require('can-types');
var dev = require('can-util/js/dev/dev');
var diff = require('can-util/js/diff/diff');
var diffObject = require('can-util/js/diff-object/diff-object');
var canReflect = require('can-reflect');
var canSymbol = require('can-symbol');

// ## route.js
// `can-route`
// _Helps manage browser history (and client state) by synchronizing the
// `window.location.hash` with a `Map`._
//
// Helper methods used for matching routes.
// `RegExp` used to match route variables of the type '{name}'.
// Any word character or a period is matched.
var curliesMatcher = /\{\s*([\w.]+)\s*\}/g;
var colonMatcher = /\:([\w.]+)/g;
// Regular expression for identifying &amp;key=value lists.
var paramsMatcher = /^(?:&[^=]+=[^&]*)+/;
// Converts a JS Object into a list of parameters that can be
// inserted into an html element tag.
var makeProps = function (props) {
	var tags = [];
	each(props, function (val, name) {
		tags.push((name === 'className' ? 'class' : name) + '="' +
			(name === "href" ? val : string.esc(val)) + '"');
	});
	return tags.join(" ");
};
// Checks if a route matches the data provided. If any route variable
// is not present in the data, the route does not match. If all route
// variables are present in the data, the number of matches is returned
// to allow discerning between general and more specific routes.
var matchesData = function (route, data) {
	var count = 0,
		i = 0,
		defaults = {};
	// look at default values, if they match ...
	for (var name in route.defaults) {
		if (route.defaults[name] === data[name]) {
			// mark as matched
			defaults[name] = 1;
			count++;
		}
	}
	for (; i < route.names.length; i++) {
		if (!data.hasOwnProperty(route.names[i])) {
			return -1;
		}
		if (!defaults[route.names[i]]) {
			count++;
		}

	}

	return count;
};
var location = typeof window !== 'undefined' ? window.location : {};
var wrapQuote = function (str) {
	return (str + '')
		.replace(/([.?*+\^$\[\]\\(){}|\-])/g, "\\$1");
};
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

var removeBackslash = function (str) {
	return str.replace(/\\/g, "");
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
var eventsObject = assign({}, canEvent);

var canRoute = function (url, defaults) {
	// if route ends with a / and url starts with a /, remove the leading / of the url
	var root = canRoute._call("root");

	if (root.lastIndexOf("/") === root.length - 1 &&
		url.indexOf("/") === 0) {
		url = url.substr(1);
	}

	defaults = defaults || {};
	// Extract the variable names and replace with `RegExp` that will match
	// an atual URL with values.
	var names = [],
		res,
		test = "",
		matcher,
		lastIndex,
		next,
		querySeparator = canRoute._call("querySeparator"),
		matchSlashes = canRoute._call("matchSlashes");

	// fall back to legacy `:foo` RegExp if necessary
	if (colonMatcher.test(url)) {
		matcher = colonMatcher;

		//!steal-remove-start
		dev.warn('update route "' + url + '" to "' + url.replace(colonMatcher, function(name, key) {
			return '{' + key + '}';
		}) + '"');
		//!steal-remove-end
	} else {
		matcher = curliesMatcher;
	}
	lastIndex = matcher.lastIndex = 0;

	// res will be something like ["{foo}","foo"]
	while (res = matcher.exec(url)) {
		names.push(res[1]);
		test += removeBackslash(url.substring(lastIndex, matcher.lastIndex - res[0].length));
		// if matchSlashes is false (the default) don't greedily match any slash in the string, assume its part of the URL
		next = "\\" + (removeBackslash(url.substr(matcher.lastIndex, 1)) || querySeparator+(matchSlashes? "": "|/"));
		// a name without a default value HAS to have a value
		// a name that has a default value can be empty
		// The `\\` is for string-escaping giving single `\` for `RegExp` escaping.
		test += "([^" + next + "]" + (defaults[res[1]] ? "*" : "+") + ")";
		lastIndex = matcher.lastIndex;
	}
	test += url.substr(lastIndex)
		.replace("\\", "");

	//!steal-remove-start
	// warn if new route uses same map properties as an existing route
	each(canRoute.routes, function(r) {
		var existingKeys = r.names.concat(Object.keys(r.defaults)).sort();
		var keys = names.concat(Object.keys(defaults)).sort();
		var sameMapKeys = !diff(existingKeys, keys).length;
		var sameDefaultValues = !diffObject(r.defaults, defaults).length;
		//the regex removes the trailing slash
		var matchingRoutesWithoutTrailingSlash = r.route.replace(/\/$/, "") === url.replace(/\/$/, "");

		if (sameMapKeys && sameDefaultValues && !matchingRoutesWithoutTrailingSlash) {
			dev.warn('two routes were registered with matching keys:\n' +
				'\t(1) route("' + r.route + '", ' + JSON.stringify(r.defaults) + ')\n' +
				'\t(2) route("' + url + '", ' + JSON.stringify(defaults) + ')\n' +
				'(1) will always be chosen since it was registered first');
		}
	});
	//!steal-remove-end

	// Add route in a form that can be easily figured out.
	canRoute.routes[url] = {
		// A regular expression that will match the route when variable values
		// are present; i.e. for (`{page}/{type}`) the `RegExp` is `/([\w\.]*)/([\w\.]*)/` which
		// will match for any value of `{page}` and `{type}` (word chars or period).
		test: new RegExp("^" + test + "($|" + wrapQuote(querySeparator) + ")"),
		// The original URL, same as the index for this entry in routes.
		route: url,
		// An `array` of all the variable names in this route.
		names: names,
		// Default values provided for the variables.
		defaults: defaults,
		// The number of parts in the URL separated by `/`.
		length: url.split('/')
			.length
	};
	return canRoute;
};

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
			path =canRoute.param(serialized, true);
		canRoute._call("setURL", path, newProps, old);
		// trigger a url change so its possible to live-bind on url-based changes
		canEvent.dispatch.call(eventsObject,"__url",[path, lastHash]);
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

// makes sure source has every value in matcher
var matchCheck = function(source, matcher){
	/*jshint eqeqeq:false*/
	for(var prop in source) {
		var s = source[prop],
			m = matcher[prop];
		if(s && m && typeof s === "object" && typeof matcher === "object") {
			return matchCheck(s, m);
		}
		if(s != m) {
			return false;
		}
	}
	return true;
};

var // Deparameterizes the portion of the hash of interest and assign the
// values to the `route.data` removing existing values no longer in the hash.
// setState is called typically by hashchange which fires asynchronously
// So it's possible that someone started changing the data before the
// hashchange event fired.  For this reason, it will not set the route data
// if the data is changing or the hash already matches the hash that was set.
setState =canRoute.setState = function () {
	var hash =canRoute._call("matchingPartOfURL");
	var oldParams = curParams;
	curParams =canRoute.deparam(hash);
	var matched;

	// if the hash data is currently changing, or
	// the hash is what we set it to anyway, do NOT change the hash
	if (!changingData || hash !== lastHash) {
		canRoute.batch.start();
		recursiveClean(oldParams, curParams,canRoute.data);

		matched = curParams.route;
		delete curParams.route;
		canRoute.matched(matched);
		canRoute.attr(curParams);
		curParams.route = matched;
		// trigger a url change so its possible to live-bind on url-based changes
		canEvent.dispatch.call(eventsObject,"__url",[hash, lastHash]);
		canRoute.batch.stop();
	}
};

var decode = function(str){
	try {
		return decodeURIComponent(str);
	} catch(ex) {
		return unescape(str);
	}
};

/**
 * @static
 */
assign(canRoute, {

	/**
	 * @function can-route.param param
	 * @parent can-route.static
	 * @description Get a route path from given data.
	 * @signature `route.param(data)`
	 * @param {data} object The data to populate the route with.
	 * @return {String} The route, with the data populated in it.
	 *
	 * @body
	 * Parameterizes the raw JS object representation provided in data.
	 *
	 * ```js
	 * route.param({ type: "video", id: 5 });
	 *   // -> "type=video&id=5"
	 * ```
	 *
	 * If a route matching the provided data is found, that URL is built
	 * from the data. Any remaining data is added at the end of the
	 * URL as &amp; separated key/value parameters.
	 *
	 * ```js
	 * route("{type}/{id}");
	 *
	 * route.param({ type: "video", id: 5 }) // -> "video/5"
	 * route.param({ type: "video", id: 5, isNew: false })
	 *   // -> "video/5&isNew=false"
	 * ```
	 */
	param: function (data, _setRoute) {
		// Check if the provided data keys match the names in any routes;
		// Get the one with the most matches.
		var route,
			// Need to have at least 1 match.
			matches = 0,
			matchCount,
			routeName = data.route,
			propCount = 0,
			cpy,
			res,
			after,
			matcher;

		delete data.route;

		each(data, function () {
			propCount++;
		});
		// Otherwise find route.
		each(canRoute.routes, function (temp, name) {
			// best route is the first with all defaults matching

			matchCount = matchesData(temp, data);
			if (matchCount > matches) {
				route = temp;
				matches = matchCount;
			}
			if (matchCount >= propCount) {
				return false;
			}
		});
		// If we have a route name in our `canRoute` data, and it's
		// just as good as what currently matches, use that
		if (canRoute.routes[routeName] && matchesData(canRoute.routes[routeName], data) === matches) {
			route = canRoute.routes[routeName];
		}
		// If this is match...
		if (route) {
			cpy = assign({}, data);
			// fall back to legacy :foo RegExp if necessary
			matcher = colonMatcher.test(route.route) ? colonMatcher : curliesMatcher;
			// Create the url by replacing the var names with the provided data.
			// If the default value is found an empty string is inserted.
			res = route.route.replace(matcher, function (whole, name) {
				delete cpy[name];
				return data[name] === route.defaults[name] ? "" : encodeURIComponent(data[name]);
			})
			.replace("\\", "");
			// Remove matching default values
			each(route.defaults, function (val, name) {
				if (cpy[name] === val) {
					delete cpy[name];
				}
			});
			// The remaining elements of data are added as
			// `&amp;` separated parameters to the url.
			after = param(cpy);
			// if we are paraming for setting the hash
			// we also want to make sure the route value is updated
			if (_setRoute) {
				canRoute.matched(route.route);
			}
			return res + (after ? canRoute._call("querySeparator") + after : "");
		}
		// If no route was found, there is no hash URL, only paramters.
		return isEmptyObject(data) ? "" :canRoute._call("querySeparator") + param(data);
	},
	/**
	 * @function can-route.deparam deparam
	 * @parent can-route.static
	 * @description Extract data from a route path.
	 * @signature `route.deparam(url)`
	 *
	 * Extract data from a url, creating an object representing its values.
	 *
	 * ```js
	 * route("{page}");
	 *
	 * var result = route.deparam("page=home");
	 * console.log(result.page); // -> "home"
	 * ```
	 *
	 * @param {String} url A route fragment to extract data from.
	 * @return {Object} An object containing the extracted data.
	 *
	 * @body
	 *
	 * Creates a data object based on the query string passed into it. This is
	 * useful to create an object based on the `location.hash`.
	 *
	 * ```js
	 * route.deparam("id=5&type=videos");
	 *   // -> { id: 5, type: "videos" }
	 * ```
	 *
	 *
	 * It's important to make sure the hash or exclamation point is not passed
	 * to `route.deparam` otherwise it will be included in the first property's
	 * name.
	 *
	 * ```js
	 * route.data.id = 5 // location.hash -> #!id=5
	 * route.data.type = "videos"
	 *   // location.hash -> #!id=5&type=videos
	 * route.deparam(location.hash);
	 *   // -> { #!id: 5, type: "videos" }
	 * ```
	 *
	 * `route.deparam` will try and find a matching route and, if it does,
	 * will deconstruct the URL and parse out the key/value parameters into the
	 * data object.
	 *
	 * ```js
	 * route("{type}/{id}");
	 *
	 * route.deparam("videos/5");
	 *   // -> { id: 5, route: "{type}/{id}", type: "videos" }
	 * ```
	 */
	deparam: function (url) {

		// remove the url
		var root =canRoute._call("root");
		if (root.lastIndexOf("/") === root.length - 1 &&
			url.indexOf("/") === 0) {
			url = url.substr(1);
		}

		// See if the url matches any routes by testing it against the `route.test` `RegExp`.
		// By comparing the URL length the most specialized route that matches is used.
		var route = {
			length: -1
		},
			querySeparator =canRoute._call("querySeparator"),
			paramsMatcher =canRoute._call("paramsMatcher");

		each(canRoute.routes, function (temp, name) {
			if (temp.test.test(url) && temp.length > route.length) {
				route = temp;
			}
		});
		// If a route was matched.
		if (route.length > -1) {

			var // Since `RegExp` backreferences are used in `route.test` (parens)
			// the parts will contain the full matched string and each variable (back-referenced) value.
			parts = url.match(route.test),
				// Start will contain the full matched string; parts contain the variable values.
				start = parts.shift(),
				// The remainder will be the `&amp;key=value` list at the end of the URL.
				remainder = url.substr(start.length - (parts[parts.length - 1] === querySeparator ? 1 : 0)),
				// If there is a remainder and it contains a `&amp;key=value` list deparam it.
				obj = (remainder && paramsMatcher.test(remainder)) ? deparam(remainder.slice(1)) : {};

			// Add the default values for this route.
			obj = deepAssign(true, {}, route.defaults, obj);
			// Overwrite each of the default values in `obj` with those in
			// parts if that part is not empty.
			each(parts, function (part, i) {
				if (part && part !== querySeparator) {
					obj[route.names[i]] = decode(part);
				}
			});
			obj.route = route.route;
			return obj;
		}
		// If no route was matched, it is parsed as a `&amp;key=value` list.
		if (url.charAt(0) !== querySeparator) {
			url = querySeparator + url;
		}
		return paramsMatcher.test(url) ? deparam(url.slice(1)) : {};
	},
	map: function(data){
		//!steal-remove-start
		dev.warn('Set route.data directly instead of calling route.map');
		//!steal-remove-end
		canRoute.data = data;
	},
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
	routes: {},
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
	/**
	 * @function can-route.url url
	 * @parent can-route.static
	 * @description Creates a URL fragment based on registered routes given a set of data.
	 * @signature `route.url(data [, merge])`
	 *
	 * Make a URL fragment that when set to window.location.hash will update can-route's properties
	 * to match those in `data`.
	 *
	 * ```js
	 * route.url({ page: "home" });
	 * // -> "#!page=home"
	 * ```
	 *
	 * @param {Object} data The data to populate the route with.
	 * @param {Boolean} [merge] Whether the given options should be merged into
	 * the current state of the route.
	 * @return {String} The route URL and query string.
	 *
	 * @body
	 * Similar to [can-route.link], but instead of creating an anchor tag,
	 * `route.url` creates only the URL based on the route options passed into it.
	 *
	 * ```js
	 * route.url( { type: "videos", id: 5 } );
	 *   // -> "#!type=videos&id=5"
	 * ```
	 *
	 * If a route matching the provided data is found the URL is built from the
	 * data. Any remaining data is added at the end of the URL as & separated
	 * key/value parameters.
	 *
	 * ```js
	 * route("{type}/{id}");
	 *
	 * route.url( { type: "videos", id: 5 } ) // -> "#!videos/5"
	 * route.url( { type: "video", id: 5, isNew: false } )
	 *   // -> "#!video/5&isNew=false"
	 * ```
	 */
	url: function (options, merge) {

		if (merge) {
			Observation.add(eventsObject,"__url");
			var baseOptions = canRoute.deparam(canRoute._call("matchingPartOfURL"));
			options = assign(assign({}, baseOptions), options);
		}
		return canRoute._call("root") +canRoute.param(options);
	},
	/**
	 * @function can-route.link link
	 * @parent can-route.static
	 * @description Creates a string representation of an anchor link using
	 * data and the registered routes.
	 * @signature `route.link(innerText, data, props [, merge])`
	 *
	 * Make an anchor tag (`<A>`) that when clicked on will update can-route's
	 * properties to match those in `data`.
	 *
	 * @param {Object} innerText The text inside the link.
	 * @param {Object} data The data to populate the route with.
	 * @param {Object} props Properties for the anchor other than `href`.
	 * @param {Boolean} [merge] Whether the given options should be merged into the current state of the route.
	 * @return {String} A string with an anchor tag that points to the populated route.
	 *
	 * @body
	 * Creates and returns an anchor tag with an href of the route
	 * attributes passed into it, as well as any properties desired
	 * for the tag.
	 *
	 * ```js
	 * route.link( "My videos", { type: "videos" }, {}, false )
	 *   // -> <a href="#!type=videos">My videos</a>
	 * ```
	 *
	 * Other attributes besides href can be added to the anchor tag
	 * by passing in a data object with the attributes desired.
	 *
	 * ```js
	 * route.link( "My videos", { type: "videos" },
	 *   { className: "new" }, false )
	 *     // -> <a href="#!type=videos" class="new">My Videos</a>
	 * ```
	 *
	 * It is possible to utilize the current route options when making anchor
	 * tags in order to make your code more reusable. If merge is set to true,
	 * the route options passed into `canRoute.link` will be passed into the
	 * current ones.
	 *
	 * ```js
	 * location.hash = "#!type=videos"
	 * route.link( "The zoo", { id: 5 }, true )
	 *   // -> <a href="#!type=videos&id=5">The zoo</true>
	 *
	 * location.hash = "#!type=pictures"
	 * route.link( "The zoo", { id: 5 }, true )
	 *   // -> <a href="#!type=pictures&id=5">The zoo</true>
	 * ```
	 */
	link: function (name, options, props, merge) {
		return "<a " + makeProps(
			assign({
				href:canRoute.url(options, merge)
			}, props)) + ">" + name + "</a>";
	},
	/**
	 * @function can-route.current current
	 * @parent can-route.static
	 *
	 * Check if data represents the current route.
	 *
	 * @signature `route.current(data [,subsetMatch] )`
	 *
	 * Compares `data` to the current route. Used to verify if an object is
	 * representative of the current route.
	 *
	 * ```
	 * route.data.set({page: "recipes", id: '5'});
	 *
	 * route.current({page: "recipes"});       //-> false
	 * route.current({page: "recipes"}, true); //-> true
	 * ```
	 *
	 *   @param {Object} data Data to check agains the current route.
	 *   @param {Boolean} [subsetMatch] If true, `route.current` will return true
	 *   if every value in `data` matches the current route data, even if
	 *   the route data has additional properties that are not matched.  Defaults to `false`
	 *   where every property needs to be present.
	 *   @return {Boolean} Whether the data matches the current URL.
	 *
	 * @body
	 *
	 * ## Use
	 *
	 * Checks the page's current URL to see if the route represents the options
	 * passed into the function.
	 *
	 * Returns true if the options represent the current URL.
	 *
	 * ```js
	 * route.data.id = 5; // location.hash -> "#!id=5"
	 * route.current({ id: 5 }); // -> true
	 * route.current({ id: 5, type: 'videos' }); // -> false
	 *
	 * route.data.type = 'videos';
	 *   // location.hash -> #!id=5&type=videos
	 * route.current({ id: 5, type: 'videos' }); // -> true
	 * ```
	 */
	current: function (options, subsetMatch) {
		// "reads" the url so the url is live-bindable.
		Observation.add(eventsObject,"__url");
		if(subsetMatch) {
			// everything in options shouhld be in baseOptions
			var baseOptions = canRoute.deparam(canRoute._call("matchingPartOfURL"));
			return matchCheck(options, baseOptions);
		} else {
			return this._call("matchingPartOfURL") === canRoute.param(options);
		}
	},
	bindings: {
		hashchange: {
			paramsMatcher: paramsMatcher,
			querySeparator: "&",
			// don't greedily match slashes in routing rules
			matchSlashes: false,
			bind: function () {
				canEvent.on.call(window, 'hashchange', setState);
			},
			unbind: function () {
				canEvent.on.call(window, 'hashchange', setState);
			},
			// Gets the part of the url we are determinging the route from.
			// For hashbased routing, it's everything after the #, for
			// pushState it's configurable
			matchingPartOfURL: function () {
				var loc =canRoute.location || location;
				return loc.href.split(/#!?/)[1] || "";
			},
			// gets called with the serializedcanRoute data after a route has changed
			// returns what the url has been updated to (for matching purposes)
			setURL: function (path) {
				if(location.hash !== "#" + path) {
					location.hash = "!" + path;
				}
				return path;
			},
			root: "#!"
		}
	},
	defaultBinding: "hashchange",
	currentBinding: null,
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
			canRoute._call("bind");
			canRoute.serializedCompute.addEventListener("change", onRouteDataChange);
			canRoute.currentBinding =canRoute.defaultBinding;
		}
	},
	_teardown: function () {
		if (canRoute.currentBinding) {
			canRoute._call("unbind");
			canRoute.serializedCompute.removeEventListener("change", onRouteDataChange);
			canRoute.currentBinding = null;
		}
		clearTimeout(timer);
		changingData = 0;
	},
	// a helper to get stuff from the current or default bindings
	_call: function () {
		var args = makeArray(arguments),
			prop = args.shift(),
			binding =canRoute.bindings[canRoute.currentBinding ||canRoute.defaultBinding],
			method = binding[prop];
		if (method.apply) {
			return method.apply(binding, args);
		} else {
			return method;
		}
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
	matched: compute()
});

// The functions in the following list applied to `canRoute` (e.g. `canRoute.attr('...')`) will
// instead act on the `canRoute.data` observe.

var bindToCanRouteData = function(name, args) {
	if (!canRoute.data[name]) {
		return;
	}
	return canRoute.data[name].apply(canRoute.data, args);
};

each(['addEventListener','removeEventListener','bind', 'unbind', 'on', 'off'], function(name) {
	// exposing all internal canEvent evt's to canRoute
	canRoute[name] = function(eventName) {
		if (eventName === '__url') {
			return canEvent[name].apply(eventsObject, arguments);
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
var serializedCompute;
Object.defineProperty(canRoute,"serializedCompute", {
	get: function(){
		if(!serializedCompute) {
			serializedCompute = compute(function(){
				return canRoute.data.serialize();
			});
		}
		return serializedCompute;
	}
});
Object.defineProperty(canRoute,"data", {
	get: function(){
		if(routeData) {
			return routeData;
		} else if( types.DefaultMap ) {

			if( types.DefaultMap.prototype.toObject ) {
				var DefaultRouteMap = types.DefaultMap.extend({
					seal: false
				},{
					"*": "stringOrObservable"
				});
				return setRouteData(new DefaultRouteMap());
			} else {
				return setRouteData( stringCoercingMapDecorator( new types.DefaultMap() ) );
			}

		} else {
			throw new Error("can.route.data accessed without being set");
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

//Allow for overriding of route batching by can.transaction
canRoute.batch = canBatch;

canReflect.setKeyValue(canRoute, canSymbol.for("can.isFunctionLike"), false);

module.exports = namespace.route = canRoute;
