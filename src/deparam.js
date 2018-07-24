"use strict";
var deparam = require('can-deparam');
var canReflect = require("can-reflect");

var bindingProxy = require("./binding-proxy");
var register = require("./register");

var decode = function(str){
	try {
		return decodeURIComponent(str);
	} catch(ex) {
		return unescape(str);
	}
};

// TODO: I'm not totally sure this belongs here. This might be shifted to can-route-pushstate.
function toURLFragment(url){
	var root =bindingProxy.call("root");
	// if the root ends with `/` and the url starts with it, remove /
    if (root.lastIndexOf("/") === root.length - 1 && url.indexOf("/") === 0) {
        url = url.substr(1);
    }
	return url;
}

function canRoute_getRule(url){

	url = toURLFragment(url);
    // See if the url matches any routes by testing it against the `route.test` `RegExp`.
    // By comparing the URL length the most specialized route that matches is used.
    var route = {
        length: -1
    };

    canReflect.eachKey(register.routes, function (temp, name) {
        if (temp.test.test(url) && temp.length > route.length) {
            route = temp;
        }
    });
    // If a route was matched.
    if (route.length > -1) {
		return route;
	}
}

/**
 * @function can-route.deparam deparam
 * @parent can-route.static
 * @description Extract data from a route path.
 * @signature `route.deparam(url)`
 *
 * Extract data from a url, creating an object representing its values.
 *
 * ```js
 * route.register("{page}");
 *
 * const result = route.deparam("page=home");
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
 * route.register("{type}/{id}");
 *
 * route.deparam("videos/5");
 *   // -> { id: 5, route: "{type}/{id}", type: "videos" }
 * ```
 */
function canRoute_deparam(url) {

    var route = canRoute_getRule(url),
		querySeparator =bindingProxy.call("querySeparator"),
		paramsMatcher =bindingProxy.call("paramsMatcher");

	url = toURLFragment(url);

	// If a route was matched.
    if (route) {

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
        obj = canReflect.assignDeep(canReflect.assignDeep({}, route.defaults), obj);
        // Overwrite each of the default values in `obj` with those in
        // parts if that part is not empty.
        parts.forEach(function (part, i) {
            if (part && part !== querySeparator) {
                obj[route.names[i]] = decode(part);
            }
        });
        return obj;
    }
    // If no route was matched, it is parsed as a `&amp;key=value` list.
    if (url.charAt(0) !== querySeparator) {
        url = querySeparator + url;
    }
    return paramsMatcher.test(url) ? deparam(url.slice(1)) : {};
}

canRoute_deparam.getRule = canRoute_getRule;


module.exports = canRoute_deparam;
