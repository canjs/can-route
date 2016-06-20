# can-route

[![Build Status](https://travis-ci.org/canjs/can-route.png?branch=master)](https://travis-ci.org/canjs/can-route)

> __Note:__ This is the CanJS [can-route](https://github.com/canjs/can-route) module. The old `can-route` has been renamed to [did-route](https://www.npmjs.com/package/did-route). Many thanks to [@michaelrhodes](https://github.com/michaelrhodes) for letting us use the `can-route` module name.


- <code>[route(template [, defaults])](#routetemplate--defaults)</code>
  - <code>[route.map(MapConstructor)](#routemapmapconstructor)</code>
  - <code>[route.map(mapInstance)](#routemapmapinstance)</code>
  - <code>[route.param(data)](#routeparamdata)</code>
  - <code>[route.deparam(url)](#routedeparamurl)</code>
  - <code>[route.ready()](#routeready)</code>
  - <code>[route.url(data [, merge])](#routeurldata--merge)</code>
  - <code>[route.link(innerText, data, props [, merge])](#routelinkinnertext-data-props--merge)</code>

## API


## <code>route(template [, defaults])</code>


Create a route matching rule. Optionally provide defaults that will be applied to the [can-map] when the route matches.

```js
route(":page", { page: "home" });
```

Will apply **cart** when the url is `#cart` and **home** when the url is `#`.


1. __template__ <code>{String}</code>:
  the fragment identifier to match.  The fragment identifier
  should start with either a character (a-Z) or colon (:).  Examples:
  
  ```js
  route(":foo")
  route("foo/:bar")
  ```
  
1. __defaults__ <code>{Object}</code>:
  An object of default values.

- __returns__ <code>{can.route}</code>:
  
  

### <code>route.map(MapConstructor)</code>


Binds can-route to an instance based on a constructor. A new instance will be created and bound to:

```js
var ViewModel = Map.attr({
	define: {
		page: {
			set: function(page){
				if(page === "user") {
					this.verifyLoggedIn();
				}
				return page;
			}
		}
	}
});

route.map(ViewModel);
```


1. __MapConstructor__ <code>{can-map}</code>:
  A can-map constructor function.  A new can-map instance will be created and used as the can-map internal to can-route.
  

### <code>route.map(mapInstance)</code>


Bind can-route to an instance of a map.

```js
var map = new Map({
	page: "home"
});

route.map(map);

map.attr("page", "user");
// location.hash -> "#user"
```


1. __mapInstance__ <code>{can-map}</code>:
  A can-map instance, used as the can-map internal to can-route.
  

### <code>route.param(data)</code>


1. __object__ <code>{data}</code>:
  The data to populate the route with.

- __returns__ <code>{String}</code>:
  The route, with the data populated in it.
  

### <code>route.deparam(url)</code>


Extract data from a url, creating an object representing its values.

```js
route(":page");

var result = route.deparam("page=home");
console.log(result.page); // -> "home"
```


1. __url__ <code>{String}</code>:
  A route fragment to extract data from.

- __returns__ <code>{Object}</code>:
  An object containing the extracted data.
  

### <code>route.ready()</code>


Sets up the two-way binding between the hash and the can-route observable
map and sets the route map to its initial values.

```js
route(":page", { page: "home" }));

route.ready();
route.attr("page"); // -> "home"
```


- __returns__ <code>{canRoute}</code>:
  The can-route object.
  

### <code>route.url(data [, merge])</code>


Make a URL fragment that when set to window.location.hash will update can-route's properties
to match those in `data`.

```js
route.url({ page: "home" });
// -> "#!page=home"
```


1. __data__ <code>{Object}</code>:
  The data to populate the route with.
1. __merge__ <code>{Boolean}</code>:
  Whether the given options should be merged into the current state of the route.

- __returns__ <code>{String}</code>:
  The route URL and query string.
  

### <code>route.link(innerText, data, props [, merge])</code>


Make an anchor tag (`<A>`) that when clicked on will updatecanRoute's properties
to match those in `data`.


1. __innerText__ <code>{Object}</code>:
  The text inside the link.
1. __data__ <code>{Object}</code>:
  The data to populate the route with.
1. __props__ <code>{Object}</code>:
  Properties for the anchor other than `href`.
1. __merge__ <code>{Boolean}</code>:
  Whether the given options should be merged into the current state of the route.

- __returns__ <code>{String}</code>:
  A string with an anchor tag that points to the populated route.
  
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
