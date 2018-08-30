'use strict';

var testSauceLabs = require('test-saucelabs');

var maxDuration = 10800; // seconds, default 1800, max 10800
var commandTimeout = 600; // seconds, default 300, max 600
var idleTimeout = 1000; // seconds, default 90, max 1000

// https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities
var platforms = [/*{
	browserName: 'internet explorer',
	platform: 'Windows 10',
	version: '11.0',
	maxDuration: maxDuration,
	commandTimeout: commandTimeout,
	idleTimeout: idleTimeout
}, */{
	browserName: 'safari',
	platform: 'OS X 10.13',
	version: 'latest',
	maxDuration: maxDuration,
	commandTimeout: commandTimeout,
	idleTimeout: idleTimeout
}, {
	browserName: 'MicrosoftEdge',
	platform: 'Windows 10',
	maxDuration: maxDuration,
	commandTimeout: commandTimeout,
	idleTimeout: idleTimeout
}, {
	browserName: 'firefox',
	platform: 'Windows 10',
	version: 'latest',
	maxDuration: maxDuration,
	commandTimeout: commandTimeout,
	idleTimeout: idleTimeout
}, {
	browserName: 'googlechrome',
	platform: 'OS X 10.12',
	version: 'latest',
	maxDuration: maxDuration,
	commandTimeout: commandTimeout,
	idleTimeout: idleTimeout
}, {
	browserName: 'Safari',
	'appium-version': '1.7.1',
	platformName: 'iOS',
	platformVersion: '11.0',
	deviceName: 'iPhone 8 Simulator',
	maxDuration: maxDuration,
	commandTimeout: commandTimeout,
	idleTimeout: idleTimeout
}];

var url = 'http://localhost:3000/test/test.html?hidepassed';

testSauceLabs({
	urls: [{ name: "can-route", url : url }],
	platforms: platforms,
	zeroAssertionsPass: false
});
