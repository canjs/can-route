"use strict";
var bindingProxy = require("./binding-proxy");
var routeDeparam = require("./deparam");
var routeParam = require("./param");
var canReflect = require("can-reflect");
var string = require('can-string');


var makeProps = function (props) {
	var tags = [];
	canReflect.eachKey(props, function (val, name) {
		tags.push((name === 'className' ? 'class' : name) + '="' +
			(name === "href" ? val : string.esc(val)) + '"');
	});
	return tags.join(" ");
};
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

function canRoute_url(options, merge) {

    if (merge) {
        var baseOptions = routeDeparam(bindingProxy.call("can.getValue"));
        options = canReflect.assignMap(canReflect.assignMap({}, baseOptions), options);
    }
    return bindingProxy.call("root") +routeParam(options);
}
module.exports = {
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
     * route.register("{type}/{id}");
     *
     * route.url( { type: "videos", id: 5 } ) // -> "#!videos/5"
     * route.url( { type: "video", id: 5, isNew: false } )
     *   // -> "#!video/5&isNew=false"
     * ```
     */
    url: canRoute_url,
    /**
     * @function can-route.link link
     * @parent can-route.static
     * @description Creates a string representation of an anchor link using
     * data and the registered routes.
     * @signature `route.link(innerText, data, props [, merge])`
     *
     * Make an anchor tag (`<a>`) that when clicked on will update can-route's
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
    link: function canRoute_link(name, options, props, merge) {
        return "<a " + makeProps(
            canReflect.assignMap({
                href: canRoute_url(options, merge)
            }, props)) + ">" + name + "</a>";
    },
    /**
     * @function can-route.isCurrent isCurrent
     * @parent can-route.static
     *
     * Check if data represents the current route.
     *
     * @signature `route.isCurrent(data [,subsetMatch] )`
     *
     * Compares `data` to the current route. Used to verify if an object is
     * representative of the current route.
     *
     * ```js
     * route.data.set({page: "recipes", id: '5'});
     *
     * route.isCurrent({page: "recipes"});       //-> false
     * route.isCurrent({page: "recipes"}, true); //-> true
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
     * route.isCurrent({ id: 5 }); // -> true
     * route.isCurrent({ id: 5, type: 'videos' }); // -> false
     *
     * route.data.type = 'videos';
     *   // location.hash -> #!id=5&type=videos
     * route.isCurrent({ id: 5, type: 'videos' }); // -> true
     * ```
     */
    isCurrent: function canRoute_isCurrent(options, subsetMatch) {
		if(subsetMatch) {
			// everything in options shouhld be in baseOptions
			var baseOptions = routeDeparam( bindingProxy.call("can.getValue") );
			return matchCheck(options, baseOptions);
		} else {
			return bindingProxy.call("can.getValue") === routeParam(options);
		}
	}
};
