@function can-route.map map
@parent can-route.static

Assign a can-map instance that acts as can-route's internal can-map.  The purpose for this is to cross-bind a top level state object (Application State) to the can-route.

@signature `route.map(MapConstructor)`

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

@param {can-map} MapConstructor A can-map constructor function.  A new can-map instance will be created and used as the can-map internal to can-route.

@signature `route.map(mapInstance)`

Bind can-route to an instance of a map.

```js
var map = new Map({
	page: "home"
});

route.map(map);

map.attr("page", "user");
// location.hash -> "#user"
```

@param {can-map} mapInstance A can-map instance, used as the can-map internal to can-route.

@body

## Background

One of the biggest challenges in a complex application is getting all the different parts of the app to talk to each other simply, cleanly, and reliably. 

An elegant way to solve this problem is using the [Observer Pattern](http://en.wikipedia.org/wiki/Observer_pattern). A single object, which can be called [Application State](https://www.youtube.com/watch?v=LrzK4exG5Ss), holds the high level state of the application.

## Use

`route.map` provides an easy to way make your Application State object cross-bound to `route`, using an internal can-map instance, which is serialized into the hash (or pushstate URLs).

```js
var appState = new Map({
	petType: "dog",
	storeId: 2
});

route.map(appState);
```

## When to call it

Call `route.map` at the  start of the application lifecycle, before any calls to `route.bind`. This is because `route.map` creates a new internal `Map`, replacing the default `can.Map` instance, so binding has to occur on this new object.

```js
var appState = new Map({
	graphType: "line",
	currencyType: "USD"
});

route.map(appState);
```

## Demo

The following shows creating an appState that loads data at page load, has a virtual property 'locationIds' which serializes an array, and synchronizes the appState to can-route:

@demo can/route/docs/map.html

## Using arrays and can.Lists

If the Application State contains a property which is any non-primitive type, its useful to use the [can-map.prototype.define define] plugin to define how that property will serialize. `route` calls [can.Map.prototype.serialize serialize] internally to turn the Application State object into URL params.

The following example shows a flags property, which is an array of string-based flags:

```js
var AppState = Map.extend({
	define: {
		flags: {
		// return a string friendly format
		serialize: function(){
		return this.attr('flags').join(',');
		},
		// convert a stringified object into an array
		set: function(val){
		if(val === ""){
			return [];
		}
		var arr = val;
		if(typeof val === "string"){
			arr = val.split(',')
		}
		return arr;
	}
	}
});

var appState = new AppState({
	flags: []
});

route.map(appState);
```

## Complete example

The following example shows loading some metadata on page load, which must be loaded as part of the Application State before the components can be initialized

It also shows an example of a "virtual" property on the AppState, locationIds, which is the serialized version of a non-serializeable can.List, locations.  A setter is defined on locationIds, which will translate changes in locationIds back to the locations can.List.

```js
var AppState = Map.extend({
	define: {
		locations: {
			// don't serialize this property at all in the route
			serialize: false
		},
		// virtual property that contains a comma separated list of ids
		// based on locations that are selected
		locationIds: {

			// comma separated list of ids
			serialize: function(){
				var selected = this.attr('locations').filter(
					function(location){
						return location.attr('selected');
					});
				var ids = [];
				selected.each(function(item){
					ids.push(item.attr('id'));
				})
				return selected.join(',');
			},
			
			// toggle selected from a comma separated list of ids
			set: function(val){
				var arr = val;
				if(typeof val === "string"){
					arr = val.split(',')
				}
				// for each id, toggle any matched location
				this.attr('locations').each(function(location){
					if(arr.indexOf(location.attr('id')) !== -1){
						location.attr('selected', true);
					} else {
						location.attr('selected', false)
					}
				})
			}
		}
	}
});

// initialize and call map first, so anything binding to can-route
// will work correctly
var appState = new AppState();
route.map(appState);

// GET /locations
var locations = new Location.List({});

// when the data is ready, set the locations property
locations.done(function(){
	var appState.attr('locations', locations)

	// call ready after the appState is fully initialized
	route.ready();
});
```

## Why

The Application State object, which is cross-bound to the can-route via `route.map` and represents the overall state of the application, has several obvious uses:

* It is passed into the various components and used to communicate their own internal state.
* It provides deep linking and back button support. As the URL changes, Application State changes cause changes in application components.
* It provides the ability to "save" the current state of the page, by serializing the Application State object and saving it on the backend, then restoring with that object to load this saved state.
