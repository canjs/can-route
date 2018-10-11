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
    url: canRoute_url,

    link: function canRoute_link(name, options, props, merge) {
        return "<a " + makeProps(
            canReflect.assignMap({
                href: canRoute_url(options, merge)
            }, props)) + ">" + name + "</a>";
    },

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
