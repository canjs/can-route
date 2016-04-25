# can-route

[![Build Status](https://travis-ci.org/canjs/can-route.png?branch=master)](https://travis-ci.org/canjs/can-route)



## Usage

### ES6 use

With StealJS, you can import this module directly in a template that is autorendered:

```js
import plugin from 'can-route';
```

### CommonJS use

Use `require` to load `can-route` and everything else
needed to create a template that uses `can-route`:

```js
var plugin = require("can-route");
```

## AMD use

Configure the `can` and `jquery` paths and the `can-route` package:

```html
<script src="require.js"></script>
<script>
	require.config({
	    paths: {
	        "jquery": "node_modules/jquery/dist/jquery",
	        "can": "node_modules/canjs/dist/amd/can"
	    },
	    packages: [{
		    	name: 'can-route',
		    	location: 'node_modules/can-route/dist/amd',
		    	main: 'lib/can-route'
	    }]
	});
	require(["main-amd"], function(){});
</script>
```

### Standalone use

Load the `global` version of the plugin:

```html
<script src='./node_modules/can-route/dist/global/can-route.js'></script>
```

## Contributing

### Making a Build

To make a build of the distributables into `dist/` in the cloned repository run

```
npm install
node build
```

### Running the tests

Tests can run in the browser by opening a webserver and visiting the `test.html` page.
Automated tests that run the tests from the command line in Firefox can be run with

```
npm test
```
