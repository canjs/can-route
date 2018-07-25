@module {Object} can-route can-route
@group can-route.static static
@download can/route
@test can-route/test.html
@parent can-routing
@collection can-core
@link ../docco/route/route.html docco
@package ../package.json

@description Manage browser history and client state by synchronizing the `window.location.hash` with an observable.

@type {Object}

  Exports an object with `can-route`'s methods. The
  following describes the properties and methods on
  the can-route export:

  ```js
{
	data,     // The bound key-value observable.
    urlData,  // The observable that represents the
              // hash. Defaults to RouteHash.
	register, // Register routes that translate between
	          // the url and the bound observable.
	start,    // Begin updating the bound observable with
	          // url data and vice versa.
	deparam,  // Given url fragment, return the data for it.
	rule,     // Given url fragment, return the routing rule
	param,    // Given data, return a url fragment.
	url,      // Given data, return a url for it.
	link,     // Given data, return an <a> tag for it.
	isCurrent,   // Given data, return true if the current url matches
	             // the data.
	currentRule // Return the matched rule name.
}
```

@body


## Background information

To support the browser’s back button and bookmarking in a JavaScript
 application, most applications use
the `window.location.hash`.  By
changing the hash (via a link or JavaScript),
one is able to add to the browser’s history
without changing the page.

This provides the basics needed to
create history enabled single-page apps.  However,
`route` addresses several other needs aswell, such as:

  - Pretty urls.
  - Keeping routes independent of application code.
  - Listening to specific parts of the history changing.
  - Setup / Teardown of widgets.

## How it works

can-route is a map that represents the
`window.location.hash` as an
object.  For example, if the hash looks like:

    #!type=videos&id=5

the data in can-route looks like:

    { type: 'videos', id: 5 }

can-route keeps the state of the hash in-sync with the [can-route.data] contained within it.

## data

Underlying `can-route` is an observable map: [can-route.data can-route.data]. Depending on what type of map your application uses this could be a [can-define/map/map], an [can-observe.Object] or maybe even a [can-simple-map].

Typically, the map is the view-model of the top-level [can-component] in your
application.  For example, the following defines `<my-app>`, and uses the view-model
of a `<my-app>` element already in the page as the `route.data`:

```js
import Component from "can-component";
import route from "can-route";
import "can-stache-route-helpers";

Component.extend({
    tag: "my-app",
    ViewModel: {
        page: "string"
    },
    view: `
        {{#switch(page)}}
            {{#case("home")}}
                <h1>Home Page</h1>
                <a href="{{#routeUrl(page='products')}}">Products</a>
            {{/case}}
            {{#case("products")}}
                <h1>Products</h1>
                <a href="{{#routeUrl(page='home')}}">Home</a>
            {{/case}}
            {{#default()}}
                <h1>Page Not Found</h1>
                <a href="{{#routeUrl(page='home')}}">Home</a>
            {{/default}}
        {{/switch}}
    `
});

route.data = document.querySelector( "my-app" );
route.register( "{page}" );
route.start();
```

> __Note__: The `route.data = document.querySelector("my-app")` statement is what
> sets `route.data` to `<my-app>`'s view-model.

An observable can be set as `route.data` directly.  The following sets `route.data`
to an `AppViewModel` instance:

```js
import DefineMap from "can-define/map/map";
import route from "can-route";

const AppViewModel = DefineMap.extend( {
	page: "string"
} );
const appState = new AppViewModel();
route.data = appState;
route.register( "{page}", { page: "home" } );
route.start();
```

Understanding how maps work is essential to understanding `can-route`.

You can listen to changes in a map with `on(eventName, handler(ev, args...))` and change `can-route`’s properties by modifying `route.data`.

### Listening to changes in state

You can listen to changes in the url by listening on the underlying route data.  For example,
your route data and rule might have a page property:

```js
const AppViewModel = DefineMap.extend( {
	page: "string"
} );
route.data = new AppViewModel();
route.register( "{page}" );
route.start();
```

You can listen to when the url changes from `"#!recipes"` to `"#!settings"` with:

```js
route.data.on( "page", function( ev, newVal, oldVal ) {
    // page changed from "recipes" to "settings"
} );
```

### Updating can-route

When using a [can-define/map/map DefineMap] to back can-route, create changes in the route data by modifying it directly:

```js
route.data.page = "images";
```

Or change multiple properties at once like:

```js
route.data.update( { page: "tasks", id: 5 } );
```

When you make changes to can-route, they will automatically
change the <code>hash</code>.

If using [can-map] or [can-simple-map] to back your route, update `route.data` using `attr`.

### Encoded `/`

If the change in your route data includes a `/`, the `/` will be encoded into `%2F`.
You will see this result in the URL and `location.hash`.

```js
route.data.type = "image/bar";
// OR
route.attr( "type", "image/bar" );
```

The URL will look like this:

    https://example.com/#!type=image%2Fbar

The location hash will look like this:

    #!type=image%2Fbar

## Creating a route

Use `route.register(url, defaults)` to create a
routing rule. A rule is a mapping from a url to
an object (that is the route’s data).
In order to map to specific properties in the url,
prepend a colon to the name of the property like:

```js
route.register( "#!content/{type}" );
```

If no routes are added, or no route is matched,
can-route’s data is updated with the [can-route.deparam deparamed]
hash.

```js
location.hash = "#!type=videos";

// route -> {type : "videos"}
```

Once routes are added and the hash changes,
can-route looks for matching routes and uses them
to update can-route’s data.

```js
route.register( "#!content/{type}" );
location.hash = "#!content/images";

// route -> {type : "images"}
route.data.type = "songs";

// location.hash -> "#!content/songs"
```

Default values can be added to a route:

```js
route.register( "content/{type}", { type: "videos" } );
location.hash = "#!content/";

// route -> {type : "videos"}
// location.hash -> "#!content/"
```

Defaults can also be set on the root page of your app:

```js
route.register( "", { page: "index" } );
location.hash = "#!";

// route -> {page : "index"}
// location.hash -> "#!"
```

## Initializing can-route

After your application has created all of its routes, call [can-route.start]
to set can-route’s data to match the current hash:

```js
route.start();
```

## Changing the route

Typically, you don’t set `location.hash`
directly. Instead, you can change properties on can-route
like:

```js
route.data.type = "videos";
```

This will automatically look up the appropriate
route and update the hash.

Often, you want to create links. can-route provides
the [can-route.link] and [can-route.url] helpers to make this
easy:

```js
route.link( "Videos", { type: "videos" } );
```

## Finding the matched route

The matched rule is stored in the compute `route.currentRule` and is used to set the `window.location.hash`. The process can-route uses to find the matched rule is:
  1. Find all routes with all of their map properties set
  2. If multiple routes are matched, find the route with the highest number of set properties
  3. If multiple routes are still matched, use the route that was registered first

### Find all routes with all of their map properties set

In order for a route to be matched, all of the map properties it uses must be set. For example, in the following route, `page` and `section` must be set in order for this route to be matched:

```js
route.register( "{page}/{section}" );
route.start();
route.data.page = "contact";
route.data.section = "email";
route.currentRule(); // "{page}/{section}"
```

If a route contains default values, these map properties must also be set to match the default value in order for the route to be matched:

```js
route.register( "{page}", { section: "email" } );
route.start();
route.data.page = "contact";
route.data.section = "email";
route.currentRule(); // "{page}"
```

### Find the route with the highest number of set properties

If multiple routes have all of their properties set, the route with the highest number of set properties will be used:

```js
route.register( "{page}" );
route.register( "{page}/{section}" );
route.start();
route.data.page = "two";
route.data.section = "a";
route.currentRule(); // "{page}/{section}"
```

### Find the route that was registered first

If multiple routes are still matched, the route that was registered first will be matched:

```js
route.register( "", { page: "home" } );
route.register( "{section}" );
route.start();
route.data.page = "home";
route.data.section = "a";
route.currentRule(); // ""
```
