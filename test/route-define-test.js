/* jshint asi:true */
/* jshint -W079 */
var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var DefineMap = require('can-define/map/map');
var makeArray = require('can-util/js/make-array/make-array');
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

test("deparam", function () {
	canRoute.routes = {};
	canRoute("{page}", {
		page: "index"
	});

	var obj = canRoute.deparam("can.Control");
	deepEqual(obj, {
		page: "can.Control",
		route: "{page}"
	});

	obj = canRoute.deparam("");
	deepEqual(obj, {
		page: "index",
		route: "{page}"
	});

	obj = canRoute.deparam("can.Control&where=there");
	deepEqual(obj, {
		page: "can.Control",
		where: "there",
		route: "{page}"
	});

	canRoute.routes = {};
	canRoute("{page}/{index}", {
		page: "index",
		index: "foo"
	});

	obj = canRoute.deparam("can.Control/&where=there");
	deepEqual(obj, {
		page: "can.Control",
		index: "foo",
		where: "there",
		route: "{page}/{index}"
	}, "default value and queryparams");
});

test("deparam of invalid url", function () {
	var obj;
	canRoute.routes = {};
	canRoute("pages/{var1}/{var2}/{var3}", {
		var1: 'default1',
		var2: 'default2',
		var3: 'default3'
	});

	// This path does not match the above route, and since the hash is not
	// a &key=value list there should not be data.
	obj = canRoute.deparam("pages//");
	deepEqual(obj, {});

	// A valid path with invalid parameters should return the path data but
	// ignore the parameters.
	obj = canRoute.deparam("pages/val1/val2/val3&invalid-parameters");
	deepEqual(obj, {
		var1: 'val1',
		var2: 'val2',
		var3: 'val3',
		route: "pages/{var1}/{var2}/{var3}"
	});
});

test("deparam of url with non-generated hash (manual override)", function () {
	var obj;
	canRoute.routes = {};

	// This won't be set like this by route, but it could easily happen via a
	// user manually changing the URL or when porting a prior URL structure.
	obj = canRoute.deparam("page=foo&bar=baz&where=there");
	deepEqual(obj, {
		page: 'foo',
		bar: 'baz',
		where: 'there'
	});
});

test("param", function () {
	canRoute.routes = {};
	canRoute("pages/{page}", {
		page: "index"
	})

	var res = canRoute.param({
		page: "foo"
	});
	equal(res, "pages/foo")

	res = canRoute.param({
		page: "foo",
		index: "bar"
	});
	equal(res, "pages/foo&index=bar")

	canRoute("pages/{page}/{foo}", {
		page: "index",
		foo: "bar"
	})

	res = canRoute.param({
		page: "foo",
		foo: "bar",
		where: "there"
	});
	equal(res, "pages/foo/&where=there")

	// There is no matching route so the hash should be empty.
	res = canRoute.param({});
	equal(res, "")

	canRoute.routes = {};

	res = canRoute.param({
		page: "foo",
		bar: "baz",
		where: "there"
	});
	equal(res, "&page=foo&bar=baz&where=there")

	res = canRoute.param({});
	equal(res, "")
});

test("symmetry", function () {
	canRoute.routes = {};

	var obj = {
		page: "=&[]",
		nestedArray: ["a"],
		nested: {
			a: "b"
		}
	}

	var res = canRoute.param(obj)

	var o2 = canRoute.deparam(res)
	deepEqual(o2, obj)
});

test("light param", function () {
	canRoute.routes = {};
	canRoute("{page}", {
		page: "index"
	})

	var res = canRoute.param({
		page: "index"
	});
	equal(res, "")

	canRoute("pages/{p1}/{p2}/{p3}", {
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

test('param doesnt add defaults to params', function () {
	canRoute.routes = {};

	canRoute("pages/{p1}", {
		p2: "foo"
	})
	var res = canRoute.param({
		p1: "index",
		p2: "foo"
	});
	equal(res, "pages/index")
})

test("param-deparam", function () {

	canRoute("{page}/{type}", {
		page: "index",
		type: "foo"
	})

	var data = {
		page: "can.Control",
		type: "document",
		bar: "baz",
		where: "there"
	};
	var res = canRoute.param(data);
	var obj = canRoute.deparam(res);
	delete obj.route
	deepEqual(obj, data)
	data = {
		page: "can.Control",
		type: "foo",
		bar: "baz",
		where: "there"
	};
	res = canRoute.param(data);
	obj = canRoute.deparam(res);
	delete obj.route;
	deepEqual(data, obj)

	data = {
		page: " a ",
		type: " / "
	};
	res = canRoute.param(data);
	obj = canRoute.deparam(res);
	delete obj.route;
	deepEqual(obj, data, "slashes and spaces")

	data = {
		page: "index",
		type: "foo",
		bar: "baz",
		where: "there"
	};
	res = canRoute.param(data);
	obj = canRoute.deparam(res);
	delete obj.route;
	deepEqual(data, obj)

	canRoute.routes = {};

	data = {
		page: "foo",
		bar: "baz",
		where: "there"
	};
	res = canRoute.param(data);
	obj = canRoute.deparam(res);
	deepEqual(data, obj)
})

test("deparam-param", function () {
	canRoute.routes = {};
	canRoute("{foo}/{bar}", {
		foo: 1,
		bar: 2
	});
	var res = canRoute.param({
		foo: 1,
		bar: 2
	});
	equal(res, "/", "empty slash")

	var deparamed = canRoute.deparam("/")
	deepEqual(deparamed, {
		foo: 1,
		bar: 2,
		route: "{foo}/{bar}"
	})
})

test("precident", function () {
	canRoute.routes = {};
	canRoute("{who}", {
		who: "index"
	});
	canRoute("search/{search}");

	var obj = canRoute.deparam("can.Control");
	deepEqual(obj, {
		who: "can.Control",
		route: "{who}"
	});

	obj = canRoute.deparam("search/can.Control");
	deepEqual(obj, {
		search: "can.Control",
		route: "search/{search}"
	}, "bad deparam");

	equal(canRoute.param({
			search: "can.Control"
		}),
		"search/can.Control", "bad param");

	equal(canRoute.param({
			who: "can.Control"
		}),
		"can.Control");
});

test("better matching precident", function () {
	canRoute.routes = {};
	canRoute("{type}", {
		who: "index"
	});
	canRoute("{type}/{id}");

	equal(canRoute.param({
			type: "foo",
			id: "bar"
		}),
		"foo/bar");
})

test("linkTo", function () {
	canRoute.routes = {};
	canRoute("{foo}");
	var res = canRoute.link("Hello", {
		foo: "bar",
		baz: 'foo'
	});
	equal(res, '<a href="#!bar&baz=foo">Hello</a>');
});

test("param with route defined", function () {
	canRoute.routes = {};
	canRoute("holler")
	canRoute("foo");

	var res = canRoute.param({
		foo: "abc",
		route: "foo"
	});

	equal(res, "foo&foo=abc")
});

test("route endings", function () {
	canRoute.routes = {};
	canRoute("foo", {
		foo: true
	});
	canRoute("food", {
		food: true
	});

	var res = canRoute.deparam("food")
	ok(res.food, "we get food back")

});

test("strange characters", function () {
	canRoute.routes = {};
	canRoute("{type}/{id}");
	var res = canRoute.deparam("foo/" + encodeURIComponent("\/"))
	equal(res.id, "\/")
	res = canRoute.param({
		type: "bar",
		id: "\/"
	});
	equal(res, "bar/" + encodeURIComponent("\/"))
});

test("empty default is matched even if last", function () {

	canRoute.routes = {};
	canRoute("{who}");
	canRoute("", {
		foo: "bar"
	})

	var obj = canRoute.deparam("");
	deepEqual(obj, {
		foo: "bar",
		route: ""
	});
});

test("order matched", function () {
	canRoute.routes = {};
	canRoute("{foo}");
	canRoute("{bar}")

	var obj = canRoute.deparam("abc");
	deepEqual(obj, {
		foo: "abc",
		route: "{foo}"
	});
});

test("param order matching", function () {
	canRoute.routes = {};
	canRoute("", {
		bar: "foo"
	});
	canRoute("something/{bar}");
	var res = canRoute.param({
		bar: "foo"
	});
	equal(res, "", "picks the shortest, best match");

	// picks the first that matches everything ...
	canRoute.routes = {};

	canRoute("{recipe}", {
		recipe: "recipe1",
		task: "task3"
	});

	canRoute("{recipe}/{task}", {
		recipe: "recipe1",
		task: "task3"
	});

	res = canRoute.param({
		recipe: "recipe1",
		task: "task3"
	});

	equal(res, "", "picks the first match of everything");

	res = canRoute.param({
		recipe: "recipe1",
		task: "task2"
	});
	equal(res, "/task2")
});

test("dashes in routes", function () {
	canRoute.routes = {};
	canRoute("{foo}-{bar}");

	var obj = canRoute.deparam("abc-def");
	deepEqual(obj, {
		foo: "abc",
		bar: "def",
		route: "{foo}-{bar}"
	});

	window.location.hash = "qunit-fixture";
	window.location.hash = "";
});
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
				equal(iCanRoute.data.bla, 'blu', 'Got route change event and value is as expected');
				teardownRouteTest();
			})

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
		iframe.src = __dirname+"/define-testing.html?5";
		this.fixture.appendChild(iframe);
	});

	test("removing things from the hash", function () {

		setupRouteTest(function (iframe, iCanRoute, loc) {

			iCanRoute.serializedCompute.bind('change', function () {

				equal(iCanRoute.attr('foo'), 'bar', 'expected value for foo');

				iCanRoute.serializedCompute.unbind('change');
				iCanRoute.serializedCompute.bind('change', function(){

					equal(iCanRoute.attr('personId'), '3', 'personId');
					equal(iCanRoute.attr('foo'), undefined, 'unexpected value');
					iCanRoute.unbind('change');

					teardownRouteTest();
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
			var AppState = DefineMap.extend({seal: false},{});
			var appState = new AppState({type: "dog", id: '4'});

			iCanRoute.map(appState);

			loc.hash = "#!cat/5";
			iCanRoute.ready();

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!cat/5", "same URL");
				equal(appState.get("type"), "cat", "conflicts should be won by the URL");
				equal(appState.get("id"), "5", "conflicts should be won by the URL");
				teardownRouteTest();

			}, 30);

		});
	});

	test("canRoute.map: route is initialized from URL first, then URL params are added from canRoute.data", function(){
		setupRouteTest(function (iframe, iCanRoute, loc, win) {

			iCanRoute("{type}/{id}");
			var AppState = win.DefineMap.extend({seal: false},{});
			var appState = new AppState({section: 'home'});

			iCanRoute.map(appState);
			loc.hash = "#!cat/5";
			iCanRoute.ready();

			setTimeout(function () {

				var after = loc.href.substr(loc.href.indexOf("#"));
				equal(after, "#!cat/5&section=home", "same URL");
				equal(appState.get("type"), "cat", "hash populates the appState");
				equal(appState.get("id"), "5", "hash populates the appState");
				equal(appState.get("section"), "home", "appState keeps its properties");
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
				equal(iCanRoute.data.panelA.id, 20, "id should change");
				equal(iCanRoute.data.panelA.show, undefined, "show should be removed");

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
			route.ready();

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
			route.ready();

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
	mockRoute.start()

	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable"});
	var appState = new AppState();



	canRoute.map(appState);
	canRoute.ready();

	canRoute.serializedCompute.bind('change', function(){

		equal(canRoute.attr('name'), 'Brian', 'appState is bound to canRoute');
		canRoute.serializedCompute.unbind('change');
		appState.name = undefined;

		setTimeout(function(){
			equal( mockRoute.hash(), "#");
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
	canRoute.ready();

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

test(".url with merge=true (#16)", function(){
	mockRoute.start()

	var AppState = DefineMap.extend({seal: false},{"*": "stringOrObservable"});
	var appState = new AppState({});


	canRoute.map(appState);
	canRoute.ready();

	QUnit.stop();

	appState.set({'foo': 'bar',page: "recipe", id: 5});

	// TODO: expose a way to know when the url has changed.
	setTimeout(function(){

		QUnit.ok(canRoute.url({}, true), "empty is true");
		QUnit.ok(canRoute.url({page: "recipe"}, true), "page:recipe is true");

		QUnit.ok(canRoute.url({page: "recipe", id: 5}, true), "number to string works");
		QUnit.ok(canRoute.url({page: "recipe", id: 6}, true), "not all equal");

		mockRoute.stop();
		QUnit.start();
	},200);

});

test("matched() compute", function() {
	stop();
	var AppState = DefineMap.extend({
		seal: false
	}, {
		type: "string",
		subtype: "string"
	});
	var appState = new AppState();

	canRoute.data = appState;
	canRoute("{type}", { type: "foo" });
	canRoute("{type}/{subtype}");
	canRoute.ready();

	equal(appState.route, undefined, "should not set route on appState");
	equal(canRoute.matched(), "{type}", "should set route.matched property");

	appState.subtype = "bar";

	setTimeout(function() {
		equal(canRoute.matched(), "{type}/{subtype}", "should update route.matched property");
		start();
	}, 200);
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
