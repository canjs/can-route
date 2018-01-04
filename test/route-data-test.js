var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require("can-simple-map");
var canSymbol = require("can-symbol");

require('can-observation');

QUnit.module("can-route.data", {
	setup: function () {
		canRoute._teardown();
		canRoute.defaultBinding = "hashchange";
		this.fixture = document.getElementById("qunit-fixture");
	}
});


test("can-route.data can be set to an element with a viewModel", function(){
    var element = document.createElement("div");

    var vm = new SimpleMap();
    element[canSymbol.for("can.viewModel")] = vm;

    canRoute.data = element;


    QUnit.equal(canRoute.data, vm, "works");
});
