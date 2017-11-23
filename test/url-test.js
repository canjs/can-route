var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var DefineMap = require("can-define/map/");

var mockRoute = require("./mock-route-binding");

QUnit.module("can-route .url",{
    setup: function(){
        canRoute.routes = {};
    }
});

test(".url with merge=true (#16)", function(){
    QUnit.stop();
	mockRoute.start();

	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable"});
	var appState = new AppState({});


	canRoute.map(appState);
	canRoute.start();



	appState.set({'foo': 'bar',page: "recipe", id: 5});

    mockRoute.hash.on(function(){
        QUnit.equal(canRoute.url({}, true), "#!&foo=bar&page=recipe&id=5", "empty");
        QUnit.ok(canRoute.url({page: "recipe"}, true), "page:recipe is true");

        QUnit.ok(canRoute.url({page: "recipe", id: 5}, true), "number to string works");
        QUnit.ok(canRoute.url({page: "recipe", id: 6}, true), "not all equal");

        setTimeout(function(){
            mockRoute.stop();
            QUnit.start();
        },20);

    });

});
