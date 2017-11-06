var canRoute = require('can-route');
var QUnit = require('steal-qunit');

QUnit.test("on/off binding", function () {
	canRoute.routes = {};
	expect(1)

	canRoute.on('foo', function () {
		ok(true, "foo called");

		canRoute.off('foo');

		canRoute.attr('foo', 'baz');
	});

	canRoute.attr('foo', 'bar');
});
