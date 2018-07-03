var canRoute = require('can-route');
var QUnit = require('steal-qunit');

QUnit.module("can-route .linkTo",{
    setup: function(){
        canRoute.routes = {};
    }
});


QUnit.test("linkTo", function () {
	canRoute.routes = {};
	canRoute.register("{foo}");
	var res = canRoute.link("Hello", {
		foo: "bar",
		baz: 'foo'
	});
	equal(res, '<a href="#!bar&baz=foo">Hello</a>');
});
