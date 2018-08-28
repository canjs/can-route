/* jshint asi:true */
/* jshint -W079 */
require("./route-define-iframe-test");
var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var DefineMap = require('can-define/map/map');
var canReflect = require('can-reflect');
var stacheKey = require("can-stache-key");
var Observation = require("can-observation");

var mockRoute = require("./mock-route-binding");

require('can-observation');

QUnit.module("can/route with can-define/map/map", {
	setup: function () {
		canRoute._teardown();
		canRoute.urlData = canRoute.bindings.hashchange
		//canRoute.defaultBinding = "hashchange";
		this.fixture = document.getElementById("qunit-fixture");
	}
});

if (("onhashchange" in window)) {


if (typeof steal !== 'undefined') {

	QUnit.asyncTest("canRoute.map: conflicting route values, hash should win (canjs/canjs#979)", function(){
		mockRoute.start();


		canRoute.register("{type}/{id}");
		var AppState = DefineMap.extend({seal: false},{});
		var appState = new AppState({type: "dog", id: '4'});

		canRoute.data = appState;

		canRoute._onStartComplete = function () {
			var after = mockRoute.hash.get();
			equal(after, "cat/5", "same URL");
			equal(appState.get("type"), "cat", "conflicts should be won by the URL");
			equal(appState.get("id"), "5", "conflicts should be won by the URL");
			QUnit.start();
			mockRoute.stop();
		};

		mockRoute.hash.value = "#!cat/5";
		canRoute.start();
	});

	QUnit.test("canRoute.map: route is initialized from URL first, then URL params are added from canRoute.data (canjs/canjs#979)", function(){
		QUnit.stop();
		mockRoute.start();

		canRoute.register("{type}/{id}");
		var AppState = DefineMap.extend({seal: false},{});
		var appState = new AppState({section: 'home'});

		canRoute.data = appState;

		canRoute._onStartComplete = function () {
			equal(mockRoute.hash.value, "cat/5&section=home", "same URL");
			equal(appState.get("type"), "cat", "hash populates the appState");
			equal(appState.get("id"), "5", "hash populates the appState");
			equal(appState.get("section"), "home", "appState keeps its properties");
			ok(canRoute.data === appState, "canRoute.data is the same as appState");

			mockRoute.stop();
			QUnit.start();
		};

		mockRoute.hash.value = "#!cat/5"; // type and id get added ... this will call update url to add everything
		canRoute.start();
	});

	test("sticky enough routes (canjs#36)", function () {

		QUnit.stop();

		mockRoute.start();
		canRoute.register("active");
		canRoute.register("");

		mockRoute.hash.set("#active");
		canRoute.start()

		setTimeout(function () {

			var after = mockRoute.hash.get();
			equal(after, "active");
			mockRoute.stop();
			QUnit.start();

		}, 30);
	});

	QUnit.asyncTest("canRoute.current is live-bindable (#1156)", function () {
		mockRoute.start();


		canRoute.start();
		var isOnTestPage = new Observation(function(){
			return canRoute.isCurrent({page: "test"});
		});

		canReflect.onValue(isOnTestPage, function(){
			mockRoute.stop();
			QUnit.start();
		});

		equal(canRoute.isCurrent({page: "test"}), false, "initially not on test page")
		setTimeout(function(){
			canRoute.attr("page","test");
		},20);
	});

	QUnit.asyncTest("can.compute.read should not call canRoute (#1154)", function () {
		mockRoute.start();
		canRoute.attr("page","test");
		canRoute.start();

		var val = stacheKey.read({route: canRoute},stacheKey.reads("route")).value;

		setTimeout(function(){
			equal(val,canRoute,"read correctly");
			mockRoute.stop();
			QUnit.start();
		},1);
	});


	QUnit.asyncTest("routes should deep clean", function() {
		expect(2);

		mockRoute.start();

		var hash1 = canRoute.url({
			panelA: {
				name: "fruit",
				id: 15,
				show: true
			}
		});
		var hash2 = canRoute.url({
			panelA: {
				name: "fruit",
				id: 20,
				read: false
			}
		});
		mockRoute.hash.value = hash1;
		mockRoute.hash.value = hash2;


		canRoute._onStartComplete = function() {
			equal(canRoute.data.get('panelA').id, 20, "id should change");
			equal(canRoute.data.get('panelA').show, undefined, "show should be removed");
			mockRoute.stop();
			QUnit.start();
		};

		canRoute.start();
	});

	QUnit.asyncTest("updating bound DefineMap causes single update with a coerced string value", function() {
		expect(1);

		canRoute.start();
		var MyMap = DefineMap.extend({seal: false},{'*': "stringOrObservable"});
		var appVM = new MyMap();

		canRoute.data = appVM;

		canRoute._onStartComplete = function(){
			appVM.on('action', function(ev, newVal) {
				strictEqual(newVal, '10');
			});

			appVM.set('action', 10);

			// check after 30ms to see that we only have a single call
			setTimeout(function() {
				mockRoute.stop();
				QUnit.start();
			}, 5);
		};
		canRoute.start();
	});

	test("hash doesn't update to itself with a !", function() {
		stop();
		window.routeTestReady = function (iCanRoute, loc) {

			iCanRoute.start();
			iCanRoute.register("{path}");

			iCanRoute.attr('path', 'foo');
			setTimeout(function() {
				var counter = 0;
				try {
					equal(loc.hash, '#!foo');
				} catch(e) {
					start();
					throw e;
				}

				iCanRoute.serializedCompute.bind("change", function() {
					counter++;
				});

				loc.hash = "bar";
				setTimeout(function() {
					try {
						equal(loc.hash, '#bar');
						equal(counter, 1); //sanity check -- bindings only ran once before this change.
					} finally {
						start();
					}
				}, 100);
			}, 100);
		};
		var iframe = document.createElement('iframe');
		iframe.src = __dirname+"/define-testing.html?1";
		this.fixture.appendChild(iframe);
	});


}

test("escaping periods", function () {

	canRoute.routes = {};
	canRoute.register("{page}\\.html", {
		page: "index"
	});

	var obj = canRoute.deparam("can.Control.html");
	deepEqual(obj, {
		page: "can.Control"
	});

	equal(canRoute.param({
		page: "can.Control"
	}), "can.Control.html");

});

if (typeof require !== 'undefined') {

	test("correct stringing", function () {
		mockRoute.start();

		canRoute.routes = {};

		canRoute.attr({
			number: 1,
			bool: true,
			string: "hello",
			array: [1, true, "hello"]
		});

		QUnit.deepEqual(canRoute.attr(),{
			number: "1",
			bool: "true",
			string: "hello",
			array: ["1", "true", "hello"]
		});
		canReflect.update(canRoute.data, {});

		canRoute.attr({
			number: 1,
			bool: true,
			string: "hello",
			array: [2, false, "world"],
			obj: {
				number: 3,
				array: [4, true]
			}
		});

		QUnit.deepEqual(canRoute.attr(), {
			number: "1",
			bool: "true",
			string: "hello",
			array: ["2", "false", "world"],
			obj: {
				number: "3",
				array: ["4", "true"]
			}
		}, "nested object");

		canRoute.routes = {};
		canRoute.register("{type}/{id}");

		canReflect.update(canRoute.data, {});

		canRoute.attr({
			type: 'page',
			id: 10,
			sort_by_name: true
		});

		propEqual(canRoute.attr(), {
			type: "page",
			id: "10",
			sort_by_name: "true"
		});

	});

}

test("on/off binding", function () {
	canRoute.routes = {};
	expect(1)

	canRoute.on('foo', function () {
		ok(true, "foo called");

		canRoute.off('foo');

		canRoute.attr('foo', 'baz');
	});

	canRoute.attr('foo', 'bar');
});

test("two way binding canRoute.map with DefineMap instance", function(){
	expect(2);
	stop();
	mockRoute.start();

	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable"});
	var appState = new AppState();



	canRoute.data = appState;
	canRoute.start();

	canRoute.serializedCompute.bind('change', function(){

		equal(canRoute.attr('name'), 'Brian', 'appState is bound to canRoute');
		canRoute.serializedCompute.unbind('change');
		appState.name = undefined;

		setTimeout(function(){
			equal( mockRoute.hash.get(), "");
			mockRoute.stop();
			start();
		},20);
	});

	appState.set('name', 'Brian');
});

test(".url with merge=true", function(){
	mockRoute.start()

	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable"});
	var appState = new AppState({});


	canRoute.data = appState;
	canRoute.start();

	QUnit.stop();

	appState.set('foo', 'bar');

	// TODO: expose a way to know when the url has changed.
	setTimeout(function(){
		var result = canRoute.url({page: "recipe", id: 5}, true);
		QUnit.equal(result, "#!&foo=bar&page=recipe&id=5");

		mockRoute.stop();
		QUnit.start();
	},20);

});





}

test("param with whitespace in interpolated string (#45)", function () {
	canRoute.routes = {};
	canRoute.register("{ page }", {
		page: "index"
	})

	var res = canRoute.param({
		page: "index"
	});
	equal(res, "")

	canRoute.register("pages/{ p1 }/{    p2   }/{	p3	}", {
		p1: "index",
		p2: "foo",
		p3: "bar"
	})

	res = canRoute.param({
		p1: "index",
		p2: "foo",
		p3: "bar"
	});
	equal(res, "pages///")

	res = canRoute.param({
		p1: "index",
		p2: "baz",
		p3: "bar"
	});
	equal(res, "pages//baz/")
});


test("triggers __url event anytime a there's a change to individual properties", function(){
	mockRoute.start();

	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable", page: "string", section: "string"});
	var appState = new AppState({});

	canRoute.data = appState;
	canRoute.register('{page}');
	canRoute.register('{page}/{section}');

	QUnit.stop();
	canRoute.start();

	var matchedCount = 0;
	var onMatchCall = {
		1: function section_a() {
			canRoute.data.section = 'a';
		},
		2: function section_b() {
			canRoute.data.section = 'b';
		},
		3: function(){
			// 1st call is going from undefined to empty string
			equal(matchedCount, 3, 'calls __url event every time a property is changed');

			mockRoute.stop();
			QUnit.start();
		}
	}
	canRoute.on('__url', function updateMatchedCount() {
		// any time a route property is changed, not just the matched route
		matchedCount++;
		onMatchCall[matchedCount]();
	});

	setTimeout(function page_two() {
		canRoute.data.page = 'two';
	}, 50);

});


QUnit.asyncTest("updating unserialized prop on bound DefineMap causes single update without a coerced string value", function() {
	expect(1);
	canRoute.routes = {};
	mockRoute.start();

	var appVM = new (DefineMap.extend({
		action: {serialize: false, type: "*"}
	}))();

	canRoute.data = appVM;
	canRoute.start();

	appVM.bind('action', function(ev, newVal) {
		equal(typeof newVal, 'function');
	});

	appVM.set('action', function() {});

	// check after 30ms to see that we only have a single call
	setTimeout(function() {
		mockRoute.stop();
		QUnit.start();
	}, 5);
});
