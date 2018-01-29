/* jshint asi:true */
/* jshint -W079 */
var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var DefineMap = require('can-define/map/map');
var canReflect = require('can-reflect');

var mockRoute = require("./mock-route-binding");

require('can-observation');

QUnit.module("can/route with can-define/map/map", {
	setup: function () {
		canRoute._teardown();
		canRoute.defaultBinding = "hashchange";
		this.fixture = document.getElementById("qunit-fixture");
	}
})

if (("onhashchange" in window)) {



var teardownRouteTest;
var setupRouteTest = function(callback){

	var testarea = document.getElementById('qunit-fixture');
	var iframe = document.createElement('iframe');
	stop();
	window.routeTestReady = function(){
		var args = canReflect.toArray(arguments)
		args.unshift(iframe);
		callback.apply(null, args);
	};
	iframe.src = __dirname + "/define-testing.html?"+Math.random();
	testarea.appendChild(iframe);
	teardownRouteTest = function(){
		setTimeout(function(){
			testarea.removeChild(iframe);
			setTimeout(function(){
				start();
			},10);
		},1);
	};
};


if (typeof steal !== 'undefined') {
	test("listening to hashchange (#216, #124)", function () {

		setupRouteTest(function (iframe, iCanRoute) {

			ok(!iCanRoute.data.bla, 'Value not set yet');

			iCanRoute.bind('bla', function(){
				equal(iCanRoute.data.get("bla"), 'blu', 'Got route change event and value is as expected');
				teardownRouteTest();
			})

			iCanRoute.start();

			setTimeout(function () {
				iframe.src = iframe.src + '#!bla=blu';
			}, 10);
		});

	});
	//require("can-queues").log("flush");
	/*test("initial route fires twice", function () {
		stop();
		expect(1);
		window.routeTestReady = function (iCanRoute, loc) {
			iCanRoute("", {});
			debugger;
			iCanRoute.matched.bind('change', function(){
				ok(true, 'change triggered once')
				start();
			});
			iCanRoute.start();
		}
		var iframe = document.createElement('iframe');
		iframe.src = __dirname+"/define-testing.html?5";
		this.fixture.appendChild(iframe);
	});*/

	test("removing things from the hash", function () {

		setupRouteTest(function (iframe, iCanRoute, loc, win) {
			iCanRoute.serializedCompute.bind('change', function outerChange() {

				equal(iCanRoute.attr('foo'), 'bar', 'expected value for foo');
				iCanRoute.serializedCompute.unbind('change');
				iCanRoute.serializedCompute.bind('change', function innerChange(){

					equal(iCanRoute.attr('personId'), '3', 'personId');
					equal(iCanRoute.attr('foo'), undefined, 'unexpected value');
					iCanRoute.unbind('change');

					teardownRouteTest();
				});
				setTimeout(function () {
					iframe.contentWindow.location.hash = '#!personId=3';
				}, 100);

			});
			iCanRoute.start();
			setTimeout(function () {

				iframe.contentWindow.location.hash = '#!foo=bar';
			}, 100);
		});
	});

	test("canRoute.map: conflicting route values, hash should win (canjs/canjs#979)", function(){
		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute("{type}/{id}");
			var AppState = DefineMap.extend({seal: false},{});
			var appState = new AppState({type: "dog", id: '4'});

			iCanRoute.map(appState);

			loc.hash = "#!cat/5";
			iCanRoute.start();

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!cat/5", "same URL");
				equal(appState.get("type"), "cat", "conflicts should be won by the URL");
				equal(appState.get("id"), "5", "conflicts should be won by the URL");
				teardownRouteTest();

			}, 30);

		});
	});

	test("canRoute.map: route is initialized from URL first, then URL params are added from canRoute.data (canjs/canjs#979)", function(){
		QUnit.stop();
		mockRoute.start();


		canRoute("{type}/{id}");
		var AppState = DefineMap.extend({seal: false},{});
		var appState = new AppState({section: 'home'});

		canRoute.data = appState;
		mockRoute.hash.set("#!cat/5"); // type and id get added ... this will call update url to add everything
		canRoute.start();

		setTimeout(function () {

			equal(mockRoute.hash.get(), "#cat/5&section=home", "same URL");
			equal(appState.get("type"), "cat", "hash populates the appState");
			equal(appState.get("id"), "5", "hash populates the appState");
			equal(appState.get("section"), "home", "appState keeps its properties");
			ok(canRoute.data === appState, "canRoute.data is the same as appState");


			mockRoute.stop();
			QUnit.start();
		}, 30);


	});

	test("updating the hash", function () {
		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute.start();
			iCanRoute("{type}/{id}");
			iCanRoute.attr({
				type: "bar",
				id: "\/"
			});

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!bar/" + encodeURIComponent("\/"));

				teardownRouteTest();

			}, 30);
		});
	});

	test("sticky enough routes (canjs#36)", function () {

		QUnit.stop();

		mockRoute.start();
		canRoute("active");
		canRoute("");

		mockRoute.hash.set("#active");
		canRoute.start()

		setTimeout(function () {

			var after = mockRoute.hash.get();
			equal(after, "#active");
			mockRoute.stop();
			QUnit.start();

		}, 30);
	});

	test("unsticky routes", function () {
		setupRouteTest(function (iframe, iCanRoute, loc) {
			iCanRoute.start();
			iCanRoute("{type}");
			iCanRoute("{type}/{id}");
			iCanRoute.attr({
				type: "bar"
			});

			setTimeout(function () {
				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!bar");
				iCanRoute.attr({
					type: "bar",
					id: "\/"
				});

				// check for 1 second
				var time = new Date()
				setTimeout(function innerTimer() {
					var after = loc.href.substr(loc.href.indexOf("#"));
					var isMatch = after === "#!bar/" + encodeURIComponent("\/");
					var isWaitingTooLong = new Date() - time > 2000;
					if (isMatch || isWaitingTooLong) {
						equal(after, "#!bar/" + encodeURIComponent("\/"), "should go to type/id");
						teardownRouteTest();
					} else {
						setTimeout(innerTimer, 30);
					}
				}, 100);
			}, 100);

		});
	});

	test("canRoute.current is live-bindable (#1156)", function () {
		setupRouteTest(function (iframe, iCanRoute, loc, win) {
			iCanRoute.start();
			var isOnTestPage = new win.Observation(function(){
				return iCanRoute.isCurrent({page: "test"});
			});

			win.canReflect.onValue(isOnTestPage, function(){
				teardownRouteTest();
			});

			equal(iCanRoute.isCurrent({page: "test"}), false, "initially not on test page")
			setTimeout(function(){
				iCanRoute.attr("page","test");
			},20);
		});
	});

	test("can.compute.read should not call canRoute (#1154)", function () {
		setupRouteTest(function (iframe, iCanRoute, loc, win) {
			iCanRoute.attr("page","test");
			iCanRoute.start();

			var val = win.observeReader.read({route: iCanRoute},win.observeReader.reads("route")).value;

			setTimeout(function(){
				equal(val,iCanRoute,"read correctly");
				teardownRouteTest();
			},1);
		});
	});

	test("routes should deep clean", function() {
		expect(2);
		setupRouteTest(function (iframe, iCanRoute, loc) {
			iCanRoute.start();
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


			loc.hash = hash1;

			loc.hash = hash2;

			setTimeout(function() {
				equal(iCanRoute.data.get('panelA').id, 20, "id should change");
				equal(iCanRoute.data.get('panelA').show, undefined, "show should be removed");

				teardownRouteTest();
			}, 30);

		});
	});

	test("updating bound DefineMap causes single update with a coerced string value", function() {
		expect(1);

		setupRouteTest(function (iframe, route) {
			var MyMap = DefineMap.extend({seal: false},{'*': "stringOrObservable"});
			var appVM = new MyMap();

			route.map(appVM);
			route.start();

			appVM.bind('action', function(ev, newVal) {
				strictEqual(newVal, '10');
			});

			appVM.set('action', 10);

			// check after 30ms to see that we only have a single call
			setTimeout(function() {
				teardownRouteTest();
			}, 5);
		});
	});

	test("updating unserialized prop on bound DefineMap causes single update without a coerced string value", function() {
		expect(1);

		setupRouteTest(function (iframe, route) {
			var appVM = new (DefineMap.extend({
				action: {serialize: false, type: "*"}
			}))();

			route.map(appVM);
			route.start();

			appVM.bind('action', function(ev, newVal) {
				equal(typeof newVal, 'function');
			});

			appVM.set('action', function() {});

			// check after 30ms to see that we only have a single call
			setTimeout(function() {
				teardownRouteTest();
			}, 5);
		});
	});

	test("hash doesn't update to itself with a !", function() {
		stop();
		window.routeTestReady = function (iCanRoute, loc) {

			iCanRoute.start();
			iCanRoute("{path}");

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
	canRoute("{page}\\.html", {
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

if (typeof require === 'undefined') {

	test("correct stringing", function () {
		setupRouteTest(function(iframe, route) {
			route.routes = {};

			route.attr('number', 1);
			propEqual(route.attr(), {
				'number': "1"
			});

			route.attr({
				bool: true
			}, true);

			propEqual(route.attr(), {
				'bool': "true"
			});

			route.attr({
				string: "hello"
			}, true);
			propEqual(route.attr(), {
				'string': "hello"
			});

			route.attr({
				array: [1, true, "hello"]
			}, true);
			propEqual(route.attr(), {
				'array': ["1", "true", "hello"]
			});

			route.attr({
				number: 1,
				bool: true,
				string: "hello",
				array: [2, false, "world"],
				obj: {
					number: 3,
					array: [4, true]
				}
			}, true);

			propEqual(route.attr(), {
				number: "1",
				bool: "true",
				string: "hello",
				array: ["2", "false", "world"],
				obj: {
					number: "3",
					array: ["4", "true"]
				}
			});

			route.routes = {};
			route("{type}/{id}");

			route.attr({
				type: 'page',
				id: 10,
				sort_by_name: true
			}, true);

			propEqual(route.attr(), {
				type: "page",
				id: "10",
				sort_by_name: "true"
			});

			teardownRouteTest();
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



	canRoute.map(appState);
	canRoute.start();

	canRoute.serializedCompute.bind('change', function(){

		equal(canRoute.attr('name'), 'Brian', 'appState is bound to canRoute');
		canRoute.serializedCompute.unbind('change');
		appState.name = undefined;

		setTimeout(function(){
			equal( mockRoute.hash.get(), "#");
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


	canRoute.map(appState);
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
	canRoute("{ page }", {
		page: "index"
	})

	var res = canRoute.param({
		page: "index"
	});
	equal(res, "")

	canRoute("pages/{ p1 }/{    p2   }/{	p3	}", {
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
	canRoute('{page}');
	canRoute('{page}/{section}');

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
