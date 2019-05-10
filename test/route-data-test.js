var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require("can-simple-map");
var canSymbol = require("can-symbol");
var mockRoute = require("./mock-route-binding");

require('can-observation');

QUnit.module("can-route.data", {
	beforeEach: function(assert) {
		canRoute._teardown();
		canRoute.defaultBinding = "hashchange";
		this.fixture = document.getElementById("qunit-fixture");
	}
});


QUnit.test("can-route.data can be set to an element with a viewModel", function(assert) {
    var element = document.createElement("div");

    var vm = new SimpleMap();
    element[canSymbol.for("can.viewModel")] = vm;

    canRoute.data = element;


    assert.equal(canRoute.data, vm, "works");
});


QUnit.test("Default map registers properties", function(assert) {
    var ready = assert.async();
    mockRoute.start();

    canRoute.register("{type}/{id}");

    canRoute._onStartComplete = function () {
		var after = mockRoute.hash.get();
		assert.equal(after, "cat/5", "same URL");
		assert.equal(canRoute.data.type, "cat", "conflicts should be won by the URL");
		assert.equal(canRoute.data.id, "5", "conflicts should be won by the URL");
		ready();
		mockRoute.stop();
	};

    mockRoute.hash.value = "#!cat/5";
    canRoute.start();
});

QUnit.test("Property defaults influence the Type", function(assert) {
    var ready = assert.async();
    mockRoute.start();

    canRoute.register("{type}/{id}/{more}", { type: "dog", "id": 14, more: null });

    canRoute._onStartComplete = function () {
		var after = mockRoute.hash.get();
		assert.equal(after, "cat/7/stuff", "same URL");
		assert.equal(canRoute.data.type, "cat", "conflicts should be won by the URL");
		assert.deepEqual(canRoute.data.id, 7, "conflicts should be won by the URL");
		assert.deepEqual(canRoute.data.more, "stuff", "null defaults are converted");
		ready();
		mockRoute.stop();
	};

    mockRoute.hash.value = "#!cat/7/stuff";
    canRoute.start();
});
