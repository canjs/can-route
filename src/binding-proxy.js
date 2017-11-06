var makeArray = require('can-util/js/make-array/make-array');
var canSymbol = require("can-symbol");

var bindingProxy = {
    defaultBinding: "hashchange",
    currentBinding: null,
    bindings: {},
    call: function(){
        var args = makeArray(arguments),
            prop = args.shift(),
            binding = bindingProxy.bindings[bindingProxy.currentBinding ||bindingProxy.defaultBinding],
            method = binding[prop.indexOf("can.") === 0 ? canSymbol.for(prop) : prop];
        if (method.apply) {
            return method.apply(binding, args);
        } else {
            return method;
        }
    }
};
module.exports = bindingProxy;
