@module {Object} can-route can-route
@group can-route.static static
@download can/route
@test can-route/test.html
@parent can-routing
@collection can-core
@link ../docco/route/route.html docco
@package ../package.json

@description Manage browser history and client state by synchronizing the `window.location.hash` with an observable. See the [guides/routing Routing] for in depth examples.

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
      isCurrent,  // Given data, return true if the current url matches
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
`route` addresses several other needs as well, such as:

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

```html
<my-app>
<mock-url>

<script type="module">
import {DefineMap, Component, route} from "can";
import "//unpkg.com/mock-url@^5.0.0/mock-url.mjs";

const PageHome = Component.extend({
  tag: "page-home",
  view: `<h1>home page</h1>
    ${route.link( "Go to another page", { page: "other" }, {}, false )}`,
  ViewModel: {},
});

const PageOther = Component.extend({
  tag: "page-other",
  view: `<h1>Other page</h1>
    ${route.link( "Go home", { page: "home" }, {}, false )}`,
  ViewModel: {},
});

Component.extend({
  tag: "my-app",
  ViewModel: {
    routeData: {
      default() {
        const observableRouteData = new DefineMap();
        route.data = observableRouteData;
        route.register("{page}", { page: "home" });
        route.start();
        return observableRouteData;
      }
    },
    get componentToShow() {
      switch(this.routeData.page) {
        case "home":
          return new PageHome();
        case "other":
          return new PageOther();
      }
    },
    page: "string"
  },
  view: `
    {{componentToShow}}
  `
});
</script>
```
@codepen

An observable can be set as `route.data` directly.  The following sets `route.data`
to an `AppViewModel` instance:

```js
import {DefineMap, route} from "can";

const AppViewModel = DefineMap.extend( {
	page: "string"
} );
const appState = new AppViewModel();
route.data = appState;
route.register( "{page}", { page: "home" } );
route.start();
console.log( route.data.page ) //-> "home"
```
@codepen

Understanding how maps work is essential to understanding `can-route`.

You can listen to changes in a map with `on(eventName, handler(ev, args...))` and change `can-route`’s properties by modifying `route.data`.

### Listening to changes in state

You can listen to changes in the url by listening on the underlying route data.  For example,
your route data and rule might have a page property:

```js
import {DefineMap, route} from "can";
const AppViewModel = DefineMap.extend( {
	page: "string"
} );
route.data = new AppViewModel();
route.register( "{page}", {page: "recipes"} );
route.start();

// You can listen when the url changes from `"#!recipes"` to `"#!settings"` with:

route.data.on( "page", ( ev, newVal, oldVal ) => {
  console.log(oldVal); //-> "recipes"
  console.log(newVal); //-> "settings"
} );

route.data.page = "settings";
```
@codepen

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

### Encoded `/`

If the change in your route data includes a `/`, the `/` will be encoded into `%2F`.
You will see this result in the URL and `location.hash`.

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {DefineMap, route} from "can";

route.data = new DefineMap( {type: "image/bar"} ); // location.hash -> #!&type=image%2Fbar
route.start();
</script>
```
@codepen

## Creating a route

Use [`route.register(url, defaults)`](can-route.register) to create a
routing rule. A rule is a mapping from a url to
an object (that is the route’s data).
In order to map to specific properties in the url,
prepend a colon to the name of the property like:

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {route} from "can";

route.register( "content/{type}" );
route.data.type = "example"; // location.hash -> #!content/example
route.start();
</script>
```
@codepen

If no routes are added, or no route is matched,
can-route’s data is updated with the [can-route.deparam deparam]ed
hash.

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {route} from "can";

location.hash = "#!&type=videos";
route.start();

console.log(route.data); //-> {type : "videos"}
</script>
```
@codepen

Once routes are added and the hash changes,
can-route looks for matching routes and uses them
to update can-route’s data.

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {route} from "can";

route.register( "content/{type}" );
location.hash = "#!content/images";
route.start();

console.log( route.data ) //-> {type : "images"}
route.data.type = "songs"; // location.hash -> "#!content/songs"
</script>
```
@codepen

Default values can be added to a route:

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {route} from "can";

route.register( "content/{type}", {type: "videos"} );
location.hash = "#!content/";

route.start();

console.log( route.data ); //-> {type: "videos"}
// location.hash -> "#!content/"
</script>
```
@codepen

Defaults can also be set on the root page of your app:

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {route} from "can";

route.register( "", {page: "index"} );
location.hash = "#!";

route.start()

console.log( route.data ); //-> {page : "index"}
// location.hash -> "#!"
</script>
```
@codepen

## Initializing can-route

After your application has created all of its routes, call [can-route.start]
to set can-route’s data to match the current hash:

```js
route.start();
```

## Changing the route

Typically, you don’t set `location.hash` directly.
Instead, you can change properties on can-route
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
import {route} from "can";

route.register( "{page}/{section}" );
route.start();

route.data.page = "contact";
route.data.section = "email";

setTimeout(() => {
  const result = route.currentRule();
  console.log( result ); //-> "{page}/{section}"
}, 100);
```
@codepen

If a route contains default values, these map properties must also be set to match the default value in order for the route to be matched:

```js
import {route} from "can";

route.register( "{page}", { section: "email" } );
route.start();

route.data.page = "contact";
route.data.section = "email";

setTimeout(() => {
  const result = route.currentRule();
  console.log( result ); //-> "{page}"
}, 100);
```
@codepen


### Find the route with the highest number of set properties

If multiple routes have all of their properties set, the route with the highest number of set properties will be used:

```js
import {route} from "can";

route.register( "{page}" );
route.register( "{page}/{section}" );
route.start();

route.data.page = "two";
route.data.section = "a";

setTimeout(() => {
  const result = route.currentRule();
  console.log( result ) //-> "{page}/{section}"
}, 100);
```
@codepen

### Find the route that was registered first

If multiple routes are still matched, the route that was registered first will be matched:

```js
import {route} from "can";

route.register( "", { page: "home" } );
route.register( "{section}" );
route.start();

route.data.page = "home";
route.data.section = "a";

setTimeout(() => {
  const result = route.currentRule();
  console.log(result); //-> ""
}, 100);
```
@codepen
