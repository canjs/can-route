var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var mockRoute = require("./mock-route-binding");
var DefineMap = require("can-define/map/");

QUnit.module("can-route observablility",{
    setup: function(){
        canRoute.routes = {};
    }
});

QUnit.test("on/off binding", function () {
	canRoute.routes = {};
	expect(1);
	canRoute.on('foo', function () {
		ok(true, "foo called");

		canRoute.off('foo');

		canRoute.attr('foo', 'baz');
	});

	canRoute.attr('foo', 'bar');
});

//var queues = require("can-queues");
//queues.log("flush");
test("currentRule() compute", function() {

	mockRoute.start();
	QUnit.stop();

	var AppState = DefineMap.extend({
		seal: false
	}, {
		type: "string",
		subtype: "string"
	});
	var appState = new AppState();

	canRoute.data = appState;
	canRoute.register("{type}", { type: "foo" });
	canRoute.register("{type}/{subtype}");
	canRoute.start();

	equal(appState.route, undefined, "should not set route on appState");
	equal(canRoute.currentRule(), "{type}", "should set route.currentRule property");
	appState.subtype = "bar";
	var check = function(){
		if(canRoute.currentRule() === "{type}/{subtype}") {
			QUnit.ok(true, "moved to right route");
			mockRoute.stop();
			start();
		} else {
			setTimeout(check, 20);
		}
	};
	check();

});
