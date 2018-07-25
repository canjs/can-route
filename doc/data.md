@property {Object|HTMLElement} can-route.data data
@parent can-route.static

An observable key-value object used to cross bind to the url observable [can-route.urlData]. Set it to cross-bind a top level state object (Application ViewModel) to [can-route].

@type {Object} If `route.data` is set to a [can-reflect]ed observable object of
key-value pairs, once [can-route.start] is called, changes in `route.data`'s
properties will update the hash and vice-versa.

```js
import DefineMap from "can-define/map/map";
import route from "can-route";

route.data = new DefineMap( { page: "" } );
route.register( "{page}" );
route.start();
```


@type {HTMLElement} If `route.data` is set to an element, its
observable [can-view-model] will be used as the observable connected
to the browser's hash.  

```js
import Component from "can-component";
import route from "can-route";

Component.extend( {
	tag: "my-app",
	autoMount: true,
	ViewModel: { /* ... */ },
	view: { /* ... */ }
} );
route.data = document.querySelector( "my-app" );
route.register( "{page}" );
route.start();
```

@body

## Background

One of the biggest challenges in a complex application is getting all the different parts of the app to talk to each other simply, cleanly, and reliably.

An elegant way to solve this problem is using the [Observer Pattern](http://en.wikipedia.org/wiki/Observer_pattern). A single object, which can be called [Application ViewModel](https://www.youtube.com/watch?v=LrzK4exG5Ss), holds the high level state of the application.

## Use

Setting `route.data` is an easy way to cross-bind your Application ViewModel object to `route`. This will serialize your Application ViewModel into the hash (or pushstate URLs).

```js
const ViewModel = DefineMap.extend( {
	petType: "string",
	storeId: "number"
} );
const viewModel = new ViewModel( {
	petType: "string",
	storeId: "number"
} );
route.data = viewModel;
```

`route.data` can also be set to a constructor function. A new instance will be created and bound to:

```js
const ViewModel = DefineMap.extend( {
	page: {
		type: "string",
		set: function( page ) {
			if ( page === "user" ) {
				this.verifyLoggedIn();
			}
			return page;
		}
	}
} );
route.data = ViewModel;
```

## When to set it

Set `route.data` at the  start of the application lifecycle, before any calls to `route.addEventListener`. This will allow events to correctly bind on this new object.

## Demo

The following shows creating an Application ViewModel that loads data at page load, has a virtual property 'locationIds' which serializes an array, and synchronizes the viewModel to can-route:

@demo demos/can-route/data.html

## Complete example

The following example shows loading some metadata on page load, which must be loaded as part of the Application ViewModel before the components can be initialized

It also shows an example of a "virtual" property on the AppViewModel called locationIds, which is the serialized version of a non-serializeable can.List called  locations.  A setter is defined on locationIds, which will translate changes in locationIds back to the locations can.List.

```js
const Location = DefineMap.extend( {
	selected: "boolean",
	id: "any"
} );
const LocationList = DefineList.extend( {
	"*": Location
} );
const AppViewModel = DefineMap.extend( {
	locations: {
		type: "any",

		// don't serialize this property at all in the route
		serialize: false
	},

	// virtual property that contains a comma separated list of ids
	// based on locations that are selected
	locationIds: {

		// comma separated list of ids
		serialize: function() {
			const selected = thislocations.filter(
				function( location ) {
					return location.selected;
				} );
			const ids = [];
			selected.each( function( item ) {
				ids.push( item.id );
			} );
			return selected.join( "," );
		},

		// toggle selected from a comma separated list of ids
		set: function( val ) {
			let arr = val;
			if ( typeof val === "string" ) {
				arr = val.split( "," );
			}

			// for each id, toggle any matched location
			this.locations.forEach( function( location ) {
				if ( arr.indexOf( location.id ) !== -1 ) {
					location.selected = true;
				} else {
					location.selected = false;
				}
			} );
		}
	}
} );

// initialize and set route.data first, so anything binding to can-route
// will work correctly
const viewModel = new AppViewModel();
route.data = appViewModel;

// GET /locations
const locations = new Location.List( {} );

// when the data is ready, set the locations property
locations.done( function() {
	viewModel.locations = locations;

	// call start after the AppViewModel is fully initialized
	route.start();
} );
```

## Why

The Application ViewModel object, which is cross-bound to the can-route via `route.data` and represents the overall state of the application, has several obvious uses:

* It is passed into the various components and used to communicate their own internal state.
* It provides deep linking and back button support. As the URL changes, Application ViewModel changes cause changes in application components.
* It provides the ability to "save" the current state of the page, by serializing the Application ViewModel object and saving it on the backend, then restoring with that object to load this saved state.
