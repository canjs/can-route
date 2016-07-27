@function can-route.map map
@parent can-route.static

Assign a map instance that acts as can-route's internal map.  The purpose for this is to cross-bind a top level state object (Application ViewModel) to the can-route.

@signature `route.map(MapConstructor)`

Binds can-route to an instance based on a constructor. A new instance will be created and bound to:

```js
var ViewModel = DefineMap.extend({
	page: {
		type: "string",
		set: function(page){
			if(page === "user") {
				this.verifyLoggedIn();
			}
			return page;
		}
	}
});

route.map(ViewModel);
```

@param {Object} MapConstructor A map constructor function (a [can-map] or [can-define/map/map] most likely).  A new instance will be created and used as the map internal to can-route.

@signature `route.map(mapInstance)`

Bind can-route to an instance of a map.

```js
var ViewModel = DefineMap.extend({
	page: "string"
});
var map = new ViewModel({ page: "home" });

route.map(map);

map.attr("page", "user");
// location.hash -> "#user"
```

@param {Object} mapInstance An instance, used as the map internal to can-route.

@body

## Background

One of the biggest challenges in a complex application is getting all the different parts of the app to talk to each other simply, cleanly, and reliably. 

An elegant way to solve this problem is using the [Observer Pattern](http://en.wikipedia.org/wiki/Observer_pattern). A single object, which can be called [Application ViewModel](https://www.youtube.com/watch?v=LrzK4exG5Ss), holds the high level state of the application.

## Use

`route.map` provides an easy to way make your Application ViewModel object cross-bound to `route`, using an internal can-map instance, which is serialized into the hash (or pushstate URLs).

```js
var ViewModel = DefineMap.extend({
	petType: "string",
	storeId: "number"
});

var viewModel = new ViewModel({
	petType: "string",
	storeId: "number"
});

route.map(viewModel);
```

## When to call it

Call `route.map` at the  start of the application lifecycle, before any calls to `route.addEventListener`. This is because `route.map` creates a new internal map, replacing the default map instance, so binding has to occur on this new object.

```js
var ViewModel = DefineMap.extend({
	graphType: "string",
	currentType: "string"
});

var viewModel = new ViewModel({
	graphType: "line",
	currencyType: "USD"
});

route.map(viewModel);
```

## Demo

The following shows creating an Application ViewModel that loads data at page load, has a virtual property 'locationIds' which serializes an array, and synchronizes the viewModel to can-route:

@demo demos/can-route/map.html

## Complete example

The following example shows loading some metadata on page load, which must be loaded as part of the Application ViewModel before the components can be initialized

It also shows an example of a "virtual" property on the AppViewModel, locationIds, which is the serialized version of a non-serializeable can.List, locations.  A setter is defined on locationIds, which will translate changes in locationIds back to the locations can.List.

```js
var Location = DefineMap.extend({
	selected: "boolean",
	id: "any"
});

var LocationList = DefineList.extend({
	"*": Location
});

var AppViewModel = DefineMap.extend({
	route: "string",
	locations: {
		type: "any",
		// don't serialize this property at all in the route
		serialize: false
	},
	// virtual property that contains a comma separated list of ids
	// based on locations that are selected
	locationIds: {

		// comma separated list of ids
		serialize: function(){
			var selected = thislocations.filter(
				function(location){
					return location.selected;
				});
			var ids = [];
			selected.each(function(item){
				ids.push(item.id);
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
			this.locations.forEach(function(location){
				if(arr.indexOf(location.id) !== -1){
					location.selected = true;
				} else {
					location.selected = false;
				}
			})
		}
	}
});

// initialize and call map first, so anything binding to can-route
// will work correctly
var viewModel = new AppViewModel();
route.map(appViewModel);

// GET /locations
var locations = new Location.List({});

// when the data is ready, set the locations property
locations.done(function(){
	viewModel.locations = locations;

	// call ready after the AppViewModel is fully initialized
	route.ready();
});
```

## Why

The Application ViewModel object, which is cross-bound to the can-route via `route.map` and represents the overall state of the application, has several obvious uses:

* It is passed into the various components and used to communicate their own internal state.
* It provides deep linking and back button support. As the URL changes, Application ViewModel changes cause changes in application components.
* It provides the ability to "save" the current state of the page, by serializing the Application ViewModel object and saving it on the backend, then restoring with that object to load this saved state.
