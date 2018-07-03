var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require("can-simple-map");
var mock = require("./mock-route-binding");

require('can-observation');

QUnit.module("can-route.stop", {
	setup: function () {
		mock.stop();
		canRoute.defaultBinding = "mock";
		this.fixture = document.getElementById("qunit-fixture");
	}
});

test("Calling route.stop() tears down bindings", function(){
	QUnit.stop();
	mock.start();

	canRoute.routes = {};
	canRoute.register("{page}");
	canRoute.start();

	canRoute.data.set("page", "home");

	var hash = mock.hash;
	setTimeout(function(){
		QUnit.equal(hash.get(), "home", "set to home");

		canRoute.stop();
		canRoute.data = new SimpleMap({page: "home"});
		canRoute.start();

		canRoute.data.set("page", "cart");

		setTimeout(function(){
			QUnit.equal(hash.get(), "cart", "now it is the cart");
			QUnit.start();
		}, 30);
	}, 30);
});
