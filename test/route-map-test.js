/* jshint asi:true */
/* jshint -W079 */
var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require('can-simple-map');
var makeArray = require('can-util/js/make-array/make-array');
var dev = require('can-util/js/dev/dev');

QUnit.module("can/route with can-map", {
	setup: function () {
		canRoute._teardown();
		canRoute.defaultBinding = "hashchange";
		this.fixture = document.getElementById("qunit-fixture");
	}
});

if (("onhashchange" in window)) {

var teardownRouteTest;
var setupRouteTest = function(callback){

	var testarea = document.getElementById('qunit-fixture');
	var iframe = document.createElement('iframe');
	stop();
	window.routeTestReady = function(){
		var args = makeArray(arguments)
		args.unshift(iframe);
		callback.apply(null, args);
	};
	iframe.src = __dirname + "/testing.html?"+Math.random();
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

			ok(!iCanRoute.attr('bla'), 'Value not set yet');

			iCanRoute.bind('change', function () {

				equal(iCanRoute.attr('bla'), 'blu', 'Got route change event and value is as expected');
				teardownRouteTest();
			});

			iCanRoute.ready();

			setTimeout(function () {

				iframe.src = iframe.src + '#!bla=blu';
			}, 10);
		});

	});

	test("initial route fires twice", function () {
		stop();
		expect(1);
		window.routeTestReady = function (iCanRoute, loc) {
			iCanRoute("", {});
			iCanRoute.matched.bind('change', function(){
				ok(true, 'change triggered once')
				start();
			});
			iCanRoute.ready();
		}
		var iframe = document.createElement('iframe');
		iframe.src = __dirname+"/testing.html?5";
		this.fixture.appendChild(iframe);
	});

	test("removing things from the hash", function () {

		setupRouteTest(function (iframe, iCanRoute, loc) {
			iCanRoute.bind('change', function () {

				equal(iCanRoute.attr('foo'), 'bar', 'expected value');
				iCanRoute.unbind('change');
				iCanRoute.bind('change', function(ev, prop){
					equal(iCanRoute.attr('personId'), '3', 'personId');
					equal(iCanRoute.attr('foo'), undefined, 'unexpected value');
					iCanRoute.unbind('change');

					if (prop === 'personId') {
						teardownRouteTest();
					}
				});
				setTimeout(function () {
					iframe.contentWindow.location.hash = '#!personId=3';
				}, 100);

			});
			iCanRoute.ready();
			setTimeout(function () {

				iframe.contentWindow.location.hash = '#!foo=bar';
			}, 100);
		});
	});

	test("canRoute.map: conflicting route values, hash should win", function(){
		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute("{type}/{id}");
			var AppState = SimpleMap.extend();
			var appState = new AppState({type: "dog", id: '4'});

			iCanRoute.map(appState);

			loc.hash = "#!cat/5";
			iCanRoute.ready();

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!cat/5", "same URL");
				equal(appState.attr("type"), "cat", "conflicts should be won by the URL");
				equal(appState.attr("id"), "5", "conflicts should be won by the URL");
				teardownRouteTest();

			}, 30);

		});
	});

	test("canRoute.map: route is initialized from URL first, then URL params are added from canRoute.data", function(){
		setupRouteTest(function (iframe, iCanRoute, loc, win) {

			iCanRoute("{type}/{id}");
			var AppState = win.CanMap.extend();
			var appState = new AppState({section: 'home'});

			iCanRoute.map(appState);
			loc.hash = "#!cat/5";
			iCanRoute.ready();

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!cat/5&section=home", "same URL");
				equal(appState.attr("type"), "cat", "hash populates the appState");
				equal(appState.attr("id"), "5", "hash populates the appState");
				equal(appState.attr("section"), "home", "appState keeps its properties");
				ok(iCanRoute.data === appState, "canRoute.data is the same as appState");


				teardownRouteTest();

			}, 30);

		});
	});

	test("updating the hash", function () {
		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute.ready();
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

	test("sticky enough routes", function () {

		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute.ready()
			iCanRoute("active");
			iCanRoute("");

			loc.hash = "#!active";

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!active");

				teardownRouteTest();

			}, 30);
		});
	});

	test("unsticky routes", function () {
		setupRouteTest(function (iframe, iCanRoute, loc) {
			iCanRoute.ready();
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
					if (after === "#!bar/" + encodeURIComponent("\/")) {
						equal(after, "#!bar/" + encodeURIComponent("\/"), "should go to type/id");

						teardownRouteTest();
					} else if (new Date() - time > 2000) {
						ok(false, "hash is " + after);
						can.remove(can.$(iframe))
					} else {
						setTimeout(innerTimer, 30)
					}

				}, 100);

			}, 100);

		});
	});

	test("canRoute.current is live-bindable (#1156)", function () {
		setupRouteTest(function (iframe, iCanRoute, loc, win) {
			iCanRoute.ready();
			var isOnTestPage = new win.ObserveInfo(
				function(){
					return iCanRoute.current({page: "test"});
				},
				null,
				{
					updater: function(){
						teardownRouteTest();
					},
					_primaryDepth: 0
				});
			isOnTestPage.getValueAndBind();

			equal(iCanRoute.current({page: "test"}), false, "initially not on test page")
			setTimeout(function(){
				iCanRoute.attr("page","test");
			},20);
		});
	});

	test("can.compute.read should not call canRoute (#1154)", function () {
		setupRouteTest(function (iframe, iCanRoute, loc, win) {
			iCanRoute.attr("page","test");
			iCanRoute.ready();

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
			iCanRoute.ready();
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
				equal(iCanRoute.attr("panelA.id"), 20, "id should change");
				equal(iCanRoute.attr("panelA.show"), undefined, "show should be removed");

				teardownRouteTest();
			}, 30);

		});
	});

	test("updating bound SimpleMap causes single update with a coerced string value", function() {
		expect(1);

		setupRouteTest(function (iframe, route) {
			var appVM = new SimpleMap();

			route.map(appVM);
			route.ready();

			appVM.bind('action', function(ev, newVal) {
				strictEqual(newVal, '10');
			});

			appVM.attr('action', 10);

			// check after 30ms to see that we only have a single call
			setTimeout(function() {
				teardownRouteTest();
			}, 5);
		});
	});

	/*test("updating unserialized prop on bound can.Map causes single update without a coerced string value", function() {
		expect(1);

		setupRouteTest(function (iframe, route) {
			var appVM = new (Map.extend({define: {
				action: {serialize: false}
			}}))();

			route.map(appVM);
			route.ready();

			appVM.bind('action', function(ev, newVal) {
				equal(typeof newVal, 'function');
			});

			appVM.attr('action', function() {});

			// check after 30ms to see that we only have a single call
			setTimeout(function() {
				teardownRouteTest();
			}, 5);
		});
	});*/

	test("hash doesn't update to itself with a !", function() {
		stop();
		window.routeTestReady = function (iCanRoute, loc) {

			iCanRoute.ready();
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

				iCanRoute.bind("change", function() {
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
		iframe.src = __dirname+"/testing.html?1";
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
		page: "can.Control",
		route: "{page}\\.html"
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



test("two way binding canRoute.map with can.Map instance", function(){
	expect(1);
	var AppState = Map.extend();
	var appState = new AppState();

	canRoute.map(appState);

	canRoute.on('change', function(){
		equal(canRoute.attr('name'), 'Brian', 'appState is bound to canRoute');
		canRoute.off('change');
		appState.removeAttr('name');
	});
	appState.attr('name', 'Brian');
});

test("matched() compute", function() {
	stop();
	var AppState = Map.extend();
	var appState = new AppState();

	canRoute.data = appState;
	canRoute("{type}", { type: "foo" });
	canRoute("{type}/{subtype}");
	canRoute.ready();

	equal(appState.attr("route"), undefined, "should not set route on appState");
	equal(canRoute.matched(), "{type}", "should set route.matched property");

	appState.attr("subtype", "bar");

	setTimeout(function() {
		equal(canRoute.matched(), "{type}/{subtype}", "should update route.matched property");
		start();
	}, 200);
});

//!steal-remove-start
if (dev) {

	test("setting route.data with the same map doesn't add the decorator function multiple times", function () {
		var oldData = canRoute.data;
		var map = new Map();
		for(var i = 0; i < 10000; i++) {
			canRoute.data = map;
		}

		canRoute.ready();

		try {
			map.attr("foo", "bar");
			ok(true, "did not cause 'Maximum call stack size exceeded'");
		} catch(err) {}
		finally {
			canRoute.data = oldData;
		}
	});

}
//!steal-remove-end

}
