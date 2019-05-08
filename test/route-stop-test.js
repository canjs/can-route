var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require("can-simple-map");
var mock = require("./mock-route-binding");

require('can-observation');

QUnit.module("can-route.stop", {
	beforeEach: function(assert) {
		mock.var done = assert.async();
		canRoute.defaultBinding = "mock";
		this.fixture = document.getElementById("qunit-fixture");
	}
});

QUnit.test("Calling route.var done = assert.async() tears down bindings", function(assert) {
	var done = assert.async();
	mock.done();

	canRoute.routes = {};
	canRoute.register("{page}");
	canRoute.done();

	canRoute.data.set("page", "home");

	var hash = mock.hash;
	setTimeout(function(){
		assert.equal(hash.get(), "home", "set to home");

		canRoute.var done = assert.async();
		canRoute.data = new SimpleMap({page: "home"});
		canRoute.done();

		canRoute.data.set("page", "cart");

		setTimeout(function(){
			assert.equal(hash.get(), "cart", "now it is the cart");
			done();
		}, 30);
	}, 30);
});
