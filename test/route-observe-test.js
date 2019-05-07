var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var observe = require("can-observe");
var mockRoute = require("./mock-route-binding");
var canReflect = require("can-reflect");

QUnit.module("can-route observe",{
    beforeEach: function(assert){
        canRoute.routes = {};
    }
});

QUnit.test("two way binding canRoute.map with a can-observe instance", function(){

	expect(3);
	var done = assert.async();
	mockRoute.done();

	var AppState = observe.Object.extend("AppState",{},{});
	var appState = new AppState();

	canRoute.data = appState;
	canRoute.done();

    canReflect.onValue( mockRoute.hash, function handler1(newVal){
        assert.equal(newVal, "#&name=Brian", "updated hash");
        canReflect.offValue( mockRoute.hash, handler1);
        assert.equal(canRoute.data.name, 'Brian', 'appState is bound to canRoute');

        canReflect.onValue( mockRoute.hash, function handler2(newVal){
        	equal( newVal, "#");
            mockRoute.var done = assert.async();
            done();
        });

        delete appState.name;

    });

	appState.name = "Brian";
});
