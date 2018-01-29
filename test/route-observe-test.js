var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var observe = require("can-observe");
var mockRoute = require("./mock-route-binding");
var queues = require("can-queues");
QUnit.module("can-route observe",{
    setup: function(){
        canRoute.routes = {};
    }
});

QUnit.test("two way binding canRoute.map with a can-observe instance", function(){

	expect(3);
	stop();
	mockRoute.start()

	var AppState = observe.Object.extend("AppState",{},{});
	var appState = new AppState();

	canRoute.data = appState;
	canRoute.start();

    mockRoute.hash.on(function handler1(newVal){
        QUnit.equal(newVal, "#&name=Brian", "updated hash");
        mockRoute.hash.off(handler1);
        QUnit.equal(canRoute.data.name, 'Brian', 'appState is bound to canRoute');

        mockRoute.hash.on(function handler2(newVal){
        	equal( newVal, "#");
            mockRoute.stop();
            start();
        });

        delete appState.name;

    });

	appState.name = "Brian";
});
