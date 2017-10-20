/* jshint asi:true */
/* jshint -W079 */
var canRoute = require('can-route');
var QUnit = require('steal-qunit');
var SimpleMap = require('can-simple-map');
var makeArray = require('can-util/js/make-array/make-array');
var mockRoute = require("./mock-route-binding");
var canReflect = require('can-reflect');
var compute = require("can-compute");

require('can-observation');

QUnit.module("can/route with can-simple-map", {
	setup: function () {
		canRoute._teardown();
		canRoute.defaultBinding = "hashchange";
		this.fixture = document.getElementById("qunit-fixture");
	}
})

if (("onhashchange" in window)) {
  var teardownRouteTest;
  var setupRouteTest = function(callback, filename){
    filename = filename || 'testing-simple-map.html';
    var testarea = document.getElementById('qunit-fixture');
    var iframe = document.createElement('iframe');
    stop();
    window.routeTestReady = function(){
      var args = makeArray(arguments)
      args.unshift(iframe);
      callback.apply(null, args);
    };
    iframe.src = __dirname + "/" + filename + "?" +Math.random();
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

  test("canRoute.data should be observable when using simple map#119", function(){
    setupRouteTest(function (iframe, iCanRoute, loc, win) {

      iCanRoute('{page}', {page: 'home'});
      iCanRoute.ready();

      var c = compute(function(){
        return iCanRoute.data;
      });

      canReflect.onValue(c, function(p) {
          
      });

      setTimeout(function () {

        teardownRouteTest();
      }, 30);
    }, "testing-simple-map.html");
  });
}
