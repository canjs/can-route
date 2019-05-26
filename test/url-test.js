var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var DefineMap = require("can-define/map/");

var RouteMock = require("can-route-mock");
var canReflect = require("can-reflect");

QUnit.module("can-route .url",{
    setup: function(){
        canRoute.routes = {};
    }
});

test(".url with merge=true (#16)", function(){
    QUnit.stop();
    var oldUsing = canRoute.urlData;
    var mock = canRoute.urlData = new RouteMock();
	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable"});
	var appState = new AppState({});


	canRoute.data = appState;
	canRoute.start();

	appState.update({'foo': 'bar',page: "recipe", id: 5});

    canReflect.onValue(mock,function(){
        QUnit.equal(canRoute.url({}, true), "#!&foo=bar&page=recipe&id=5", "empty");
        QUnit.ok(canRoute.url({page: "recipe"}, true), "page:recipe is true");

        QUnit.ok(canRoute.url({page: "recipe", id: 5}, true), "number to string works");
        QUnit.ok(canRoute.url({page: "recipe", id: 6}, true), "not all equal");

        setTimeout(function(){
            canRoute.urlData = oldUsing;
            QUnit.start();
        },20);

    });

});
