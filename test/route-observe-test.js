var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var observe = require("can-observe");
var mockRoute = require("./mock-route-binding");
var canReflect = require("can-reflect");

QUnit.module("can-route observe",{
    setup: function(){
        canRoute.routes = {};
    }
});

QUnit.test("two way binding canRoute.map with a can-observe instance", function(){

	expect(3);
	stop();
	mockRoute.start();

	var AppState = observe.Object.extend("AppState",{},{});
	var appState = new AppState();

	canRoute.data = appState;
	canRoute.start();

    canReflect.onValue( mockRoute.hash, function handler1(newVal){
        QUnit.equal(newVal, "#&name=Brian", "updated hash");
        canReflect.offValue( mockRoute.hash, handler1);
        QUnit.equal(canRoute.data.name, 'Brian', 'appState is bound to canRoute');

        canReflect.onValue( mockRoute.hash, function handler2(newVal){
        	equal( newVal, "#");
            mockRoute.stop();
            start();
        });

        delete appState.name;

    });

	appState.name = "Brian";
});
