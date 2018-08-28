/* jshint asi:true */
/* jshint -W079 */
var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var canReflect = require('can-reflect');


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
	window.routeTestReady = function(iCanRoute){
		var args = canReflect.toArray(arguments)
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

			iCanRoute._onStartComplete = function () {
				iframe.src = iframe.src + '#!bla=blu';
			};

			iCanRoute.start();
		});

	});


	test("removing things from the hash", function () {

		setupRouteTest(function (iframe, iCanRoute, loc) {
			// CanJS's build was failing on this test.
			// This code is to make sure we can more information on why the build
			// failed.
			var outerChangeCalled = false;
			setTimeout(function(){
				if(outerChangeCalled === false) {
					QUnit.ok(outerChangeCalled, "no outer change called");
					teardownRouteTest();
				}
			},60000);

			iCanRoute.bind('change', function change1() {
				outerChangeCalled = true;
				equal(iCanRoute.attr('foo'), 'bar', 'expected value');
				iCanRoute.unbind('change');

				var changeFired = false,
					tearDown = false;

				iCanRoute.bind('change', function change2(ev, prop){
					changeFired = true;
					equal(iCanRoute.attr('personId'), '3', 'personId');
					equal(iCanRoute.attr('foo'), undefined, 'unexpected value');
					iCanRoute.unbind('change');

					if (prop === 'personId') {
						tearDown = true;
						teardownRouteTest();
					} else {
						QUnit.equal(prop, "foo", "removed foo");
					}
				});

				// CanJS's build was failing on this test.
				// This code is to make sure we can more information on why the build
				// failed.
				setTimeout(function(){
					if(tearDown === false) {
						QUnit.ok(changeFired, "changed was fired");
						QUnit.ok(false, "no personId change");
						teardownRouteTest();
					}
				},60000);

				// Then remove those old props and add new ones
				setTimeout(function () {
					iframe.contentWindow.location.hash = '#!personId=3';
				}, 150);

			});

			// Update the hash to have some properties and values
			iCanRoute._onStartComplete = function () {
				iframe.contentWindow.location.hash = '#!foo=bar';
			};

			iCanRoute.start();
		});
	});

	test("canRoute.map: route is initialized from URL first, then URL params are added from canRoute.data", function(){
		setupRouteTest(function (iframe, iCanRoute, loc, win) {

			iCanRoute.register("{type}/{id}");
			var AppState = win.CanMap.extend();
			var appState = new AppState({section: 'home'});

			iCanRoute.data = appState;

			iCanRoute._onStartComplete = function () {
				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!cat/5&section=home", "same URL");
				equal(appState.attr("type"), "cat", "hash populates the appState");
				equal(appState.attr("id"), "5", "hash populates the appState");
				equal(appState.attr("section"), "home", "appState keeps its properties");
				ok(iCanRoute.data === appState, "canRoute.data is the same as appState");


				teardownRouteTest();
			};

			loc.hash = "#!cat/5";
			iCanRoute.start();
		});
	});

	test("updating the hash", function () {
		setupRouteTest(function (iframe, iCanRoute, loc) {
			iCanRoute._onStartComplete = function () {
				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!bar/" + encodeURIComponent("\/"));

				teardownRouteTest();
			};

			iCanRoute.start();
			iCanRoute.register("{type}/{id}");
			iCanRoute.attr({
				type: "bar",
				id: "\/"
			});
		});
	});

	test("sticky enough routes", function () {

		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute.start()
			iCanRoute.register("active");
			iCanRoute.register("");

			loc.hash = "#!active";

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!active");

				teardownRouteTest();

			}, 30);
		});
	});

	test("updating bound SimpleMap causes single update with a coerced string value", function() {
		expect(1);

		setupRouteTest(function (iframe, route, loc, win) {
			var appVM =  new win.CanMap();

			route.data = appVM;
			route.start();

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
			route.register("{type}/{id}");

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

test("Calling attr with an object should not stringify object (#197)", function () {
	setupRouteTest(function (iframe, iCanRoute, loc, win) {
		var app = new win.CanMap({});
		app.define = { foo: { serialize: false } };

		app.attr('foo', true);
		equal(app.attr('foo'), true, 'not route data - .attr("foo", ...) works');

		app.attr({
			foo: false
		});
		equal(app.attr('foo'), false, 'not route data - .attr({"foo": ...}) works');

		iCanRoute.data = app;

		app.attr('foo', true);
		equal(app.attr('foo'), true, 'route data - .attr("foo", ...) works');

		app.attr({
			foo: false
		});
		equal(app.attr('foo'), false, 'route data - .attr({"foo": ...}) works');

		teardownRouteTest();
	});
});


}
