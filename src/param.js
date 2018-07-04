"use strict";
var canReflect = require("can-reflect");
var param = require('can-param');

var register = require("./register");
var regexps = require("./regexps");
var bindingProxy = require("./binding-proxy");

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

function getMatchedRoute(data, routeName) {
	// Check if the provided data keys match the names in any routes;
    // Get the one with the most matches.
    var route,
        // Need to have at least 1 match.
        matches = 0,
        matchCount,
        propCount = 0;

    delete data.route;

    canReflect.eachKey(data, function () {
        propCount++;
    });
    // Otherwise find route.
    canReflect.eachKey(register.routes, function (temp, name) {
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
    // If we have a route name in our `register` data, and it's
    // just as good as what currently matches, use that
    if (register.routes[routeName] && matchesData(register.routes[routeName], data) === matches) {
        route = register.routes[routeName];
    }
    // If this is match...
	return route;
}
function paramFromRoute(route, data) {
	var cpy,
		res,
		after,
		matcher;
	if (route) {

        cpy = canReflect.assignMap({}, data);
        // fall back to legacy :foo RegExp if necessary
        matcher = regexps.colon.test(route.route) ? regexps.colon : regexps.curlies;
        // Create the url by replacing the var names with the provided data.
        // If the default value is found an empty string is inserted.
        res = route.route.replace(matcher, function (whole, name) {
            delete cpy[name];
            return data[name] === route.defaults[name] ? "" : encodeURIComponent(data[name]);
        })
        .replace("\\", "");
        // Remove matching default values
        canReflect.eachKey(route.defaults, function (val, name) {
            if (cpy[name] === val) {
                delete cpy[name];
            }
        });
        // The remaining elements of data are added as
        // `&amp;` separated parameters to the url.
        after = param(cpy);
        // if we are paraming for setting the hash
        // we also want to make sure the route value is updated
        //if (_setRoute) {
        //    register.matched(route.route);
        //}
        return res + (after ? bindingProxy.call("querySeparator") + after : "");
    }
    // If no route was found, there is no hash URL, only paramters.
    return canReflect.size(data) === 0 ? "" :bindingProxy.call("querySeparator") + param(data);
}


/**
 * @function can-route.param param
 * @parent can-route.static
 * @description Get a route path from given data.
 * @signature `route.param(data)`
 * @param {data} object The data to populate the route with.
 * @param {String} [currentRouteName] The current route name.  If provided, this
 * can be used to "stick" the url to a previous route. By "stick", we mean that
 * if there are multiple registered routes that match the `object`, the
 * the `currentRouteName` will be used.
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
 * route.register("{type}/{id}");
 *
 * route.param({ type: "video", id: 5 }) // -> "video/5"
 * route.param({ type: "video", id: 5, isNew: false })
 *   // -> "video/5&isNew=false"
 * ```
 */
function canRoute_param(data, currentRouteName) {
 	return paramFromRoute(getMatchedRoute(data, currentRouteName), data);
}
module.exports = canRoute_param;
canRoute_param.paramFromRoute = paramFromRoute;
canRoute_param.getMatchedRoute = getMatchedRoute;
