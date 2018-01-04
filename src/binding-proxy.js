var canReflect = require('can-reflect');
var canSymbol = require("can-symbol");
var SimpleObservable = require("can-simple-observable");

var defaultBinding = new SimpleObservable("hashchange");

var bindingProxy = {
    get defaultBinding(){
        return defaultBinding.get();
    },
    set defaultBinding(newVal){
        defaultBinding.set(newVal);
    },
    currentBinding: null,
    bindings: {},
    call: function(){
        var args = canReflect.toArray(arguments),
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
