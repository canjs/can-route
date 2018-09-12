var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require("can-simple-map");
var canSymbol = require("can-symbol");
var mockRoute = require("./mock-route-binding");

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


QUnit.asyncTest("Default map registers properties", function(){
	mockRoute.start();

	canRoute.register("{type}/{id}");

	canRoute._onStartComplete = function () {
		var after = mockRoute.hash.get();
		equal(after, "cat/5", "same URL");
		equal(canRoute.data.type, "cat", "conflicts should be won by the URL");
		equal(canRoute.data.id, "5", "conflicts should be won by the URL");
		QUnit.start();
		mockRoute.stop();
	};

	mockRoute.hash.value = "#!cat/5";
	canRoute.start();
});

QUnit.asyncTest("Property defaults influence the Type", function(){
	mockRoute.start();

	canRoute.register("{type}/{id}/{more}", { type: "dog", "id": 14, more: null });

	canRoute._onStartComplete = function () {
		var after = mockRoute.hash.get();
		equal(after, "cat/7/stuff", "same URL");
		equal(canRoute.data.type, "cat", "conflicts should be won by the URL");
		deepEqual(canRoute.data.id, 7, "conflicts should be won by the URL");
		deepEqual(canRoute.data.more, "stuff", "null defaults are converted");
		QUnit.start();
		mockRoute.stop();
	};

	mockRoute.hash.value = "#!cat/7/stuff";
	canRoute.start();
});
