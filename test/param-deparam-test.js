var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var dev = require('can-util/js/dev/dev');

QUnit.module("can-route .param and .deparam",{
    setup: function(){
        canRoute.routes = {};
    }
});

test("deparam", function () {

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

test("param - `:page` syntax", function () {
	canRoute.routes = {};
	canRoute("pages/:page", {
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

	canRoute("pages/:page/:foo", {
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

	canRoute("pages/{p1}", {
		p2: "foo"
	})
	var res = canRoute.param({
		p1: "index",
		p2: "foo"
	});
	equal(res, "pages/index")
});

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


	data = {
		page: "foo",
		bar: "baz",
		where: "there"
	};
	res = canRoute.param(data);
	obj = canRoute.deparam(res);
	deepEqual(data, obj)
});

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
});

test("precident", function () {
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
	canRoute("{type}", {
		who: "index"
	});
	canRoute("{type}/{id}");

	equal(canRoute.param({
			type: "foo",
			id: "bar"
		}),
		"foo/bar");
});

test("param with route defined", function () {
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
	canRoute("{foo}");
	canRoute("{bar}")

	var obj = canRoute.deparam("abc");
	deepEqual(obj, {
		foo: "abc",
		route: "{foo}"
	});
});

test("param order matching", function () {
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
	canRoute("{foo}-{bar}");

	var obj = canRoute.deparam("abc-def");
	deepEqual(obj, {
		foo: "abc",
		bar: "def",
		route: "{foo}-{bar}"
	});
});


//!steal-remove-start
if (dev) {
	test("should warn when two routes have same map properties", function () {
		var oldlog = dev.warn;

		dev.warn = function(text) {
			equal(text.split(":")[0], "two routes were registered with matching keys");
		};

		canRoute("{page}/{subpage}");
		canRoute("foo/{page}/{subpage}");

		dev.warn = oldlog;
	});

	test("should warn when two routes have same map properties - including defaults", function () {
		var oldlog = dev.warn;

		dev.warn = function(text) {
			equal(text.split(":")[0], "two routes were registered with matching keys");
		};

		canRoute("foo/{page}/{subpage}");
		canRoute("{page}/{subpage}");

		dev.warn = oldlog;
	});

	test("should not warn when two routes have same map properties - but different defaults(#36)", function () {
		expect(0);
		var oldlog = dev.warn;

		dev.warn = function(text) {
			ok(false, text);
		};

		canRoute("login", { "page": "auth", "subpage": "login" });
		canRoute("signup", { "page": "auth", "subpage": "signup" });

		dev.warn = oldlog;
	});

	test("should not be display warning for matching keys when the routes do not match (#99)", function () {
		expect(1);
		var oldlog = dev.warn;
		var expectedWarningText = 'two routes were registered with matching keys:\n' +
				'\t(1) route("login", {"page":"auth"})\n' +
				'\t(2) route("signup", {"page":"auth"})\n' +
				'(1) will always be chosen since it was registered first';

		dev.warn = function(text) {
			ok(text === expectedWarningText, text)
		};

		//should warn
		canRoute("login", { "page":"auth" });
		canRoute("signup", { "page":"auth" });

		//should not warn
		canRoute("login2/", { "page":"auth2" });
		canRoute("login2", { "page":"auth2" });

		//should not warn
		canRoute("login3", { "page":"auth3" });
		canRoute("login3", { "page":"auth3" });

		dev.warn = oldlog;
	});

}
//!steal-remove-end
