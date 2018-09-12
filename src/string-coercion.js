var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

// Helper for convert any object (or value) to stringified object (or value)
var stringify = function (obj) {
	// Object is array, plain object, Map or List
	if (obj && typeof obj === "object") {
		if (obj && typeof obj === "object" && ("serialize" in obj)) {
			obj = obj.serialize();
		} else {
			// Get array from array-like or shallow-copy object
			obj = typeof obj.slice === "function" ? obj.slice() : canReflect.assign({}, obj);
		}
		// Convert each object property or array item into stringified new
		canReflect.eachKey(obj, function (val, prop) {
			obj[prop] = stringify(val);
		});
		// Object supports toString function
	} else if (obj !== undefined && obj !== null && (typeof obj.toString === "function" )) {
		obj = obj.toString();
	}

	return obj;
};

// everything in the backing Map is a string
// add type coercion during Map setter to coerce all values to strings so unexpected conflicts don't happen.
// https://github.com/canjs/canjs/issues/2206
var stringCoercingMapDecorator = function(map) {
	var sym = canSymbol.for("can.route.stringCoercingMapDecorator");
	if(!map.attr[sym]) {
		var attrSuper = map.attr;

		map.attr = function(prop, val) {
			var serializable = typeof prop === "string" &&
				(this.define === undefined || this.define[prop] === undefined || !!this.define[prop].serialize),
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

exports.stringCoercingMapDecorator = stringCoercingMapDecorator;
exports.stringify = stringify;
