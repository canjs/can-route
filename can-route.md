@function can-route can-route
@group can-route.static static
@download can/route
@test can-route/test.html
@parent can-routing
@collection can-core
@link ../docco/route/route.html docco
@package ./package.json

@description Manage browser history and client state by synchronizing the `window.location.hash` with a map.

@signature `route(template [, defaults])`

Create a route matching rule. Optionally provide defaults that will be applied to the underlying map when the route matches.

```js
route("{page}", { page: "home" });
```

Will apply **cart** when the url is `#cart` and **home** when the url is `#`.

@param {String} template the fragment identifier to match.  The fragment identifier should contain characters (a-Z), optionally wrapped in braces ( { } ). Identifiers wrapped in braces are interpreted as being properties on can-route’s map. Examples:

```js
route("{foo}")
route("foo/{bar}")
```

@param {Object} [defaults] An object of default values. These defaults are applied to can-route’s map when the route is matched.

@return {can-route}

@body

## Use

## Background information

To support the browser’s back button and bookmarking in a JavaScript
 application, most applications use
the `window.location.hash`.  By
changing the hash (via a link or JavaScript),
one is able to add to the browser’s history
without changing the page.

This provides the basics needed to
create history enabled single-page apps.  However,
`route` addresses several other needs such as:

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

can-route keeps the state of the hash in-sync with the `data` contained within it.

## data

Underlying `can-route` is an observable map: `route.data`. Depending on what type of map your application uses this could be a [can-map], a [can-define/map/map], or maybe even a [can-simple-map].

Here’s an example using [can-define/map/map DefineMap] to back `can-route`:

```js
var DefineMap = require("can-define/map/map");
var route = require("can-route");

var AppViewModel = DefineMap.extend({
    page: "string"
});

var appState = new AppViewModel();
route.data = appState;
route('{page}', {page: 'home'});
route.start();
```

Understanding how maps work is essential to understanding `can-route`.

You can listen to changes in a map with `on(eventName, handler(ev, args...))` and change `can-route`’s properties by modifying `route.data`.

### Listening to changes in can-route

Listen to changes in history by [can-event.addEventListener listening] to
changes of can-route’s `matched` compute:

```js
route.matched.on('change', function(ev, attr, how, newVal, oldVal) {
	// attr changed from oldVal -> newVal
});
```

 - `attr` - the name of the changed attribute
 - `how` - the type of Observe change event (add, set or remove)
 - `newVal`/`oldVal` - the new and old values of the attribute

### Updating can-route

When using a [can-define/map/map DefineMap] to back can-route, create changes in the route data by modifying it directly:

```js
route.data.type = 'image';
```

Or change multiple properties at once like:

```js
route.data.set({type: 'page', id: 5}, true);
```

When you make changes to can-route, they will automatically
change the <code>hash</code>.

If using [can-map] or [can-simple-map] to back your route, update `route.data` using `attr`.

### Encoded `/`

If the change in your route data includes a `/`, the `/` will be encoded into `%2F`.
You will see this result in the URL and `location.hash`.

```js
route.data.type = 'image/bar';
// OR
route.attr('type', 'image/bar');
```

The URL will look like this:

    https://example.com/#!type=image%2Fbar

The location hash will look like this:

    #!type=image%2Fbar

## Creating a route

Use `route(url, defaults)` to create a
route. A route is a mapping from a url to
an object (that is the route’s state).
In order to map to a specific properties in the url,
prepend a colon to the name of the property like:

```js
route("#!content/{type}");
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
route("#!content/{type}");
location.hash = "#!content/images";
// route -> {type : "images"}
route.data.type = "songs";
// location.hash -> "#!content/songs"
```

Default values can be added to a route:

```js
route("content/{type}",{type: "videos" });
location.hash = "#!content/"
// route -> {type : "videos"}
// location.hash -> "#!content/"
```

Defaults can also be set on the root page of your app:

```js
route("", { page: "index" });
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
route.data.type = 'videos';
```

This will automatically look up the appropriate
route and update the hash.

Often, you want to create links. can-route provides
the [can-route.link] and [can-route.url] helpers to make this
easy:

```js
route.link("Videos", {type: 'videos'});
```

## Finding the matched route

The matched route is stored in the compute `route.matched` and is used to set the `window.location.hash`. The process can-route uses to find the matched route is:
  - Find all routes with all of their map properties set
  - If multiple routes are matched, find the route with the highest number of set properties
  - If multiple routes are still matched, use the route that was registered first

### Find all routes with all of their map properties set

In order for a route to be matched, all of the map properties it uses must be set. For example, in the following route, `page` and `section` must be set in order for this route to be matched:

```js
route('{page}/{section}');
route.start();

route.data.page = 'contact';
route.data.section = 'email';

route.matched(); // "{page}/{section}"
```

If a route contains default values, these map properties must also be set to match the default value in order for the route to be matched:

```js
route('{page}', { section: 'email' });
route.start();

route.data.page = 'contact';
route.data.section = 'email';

route.matched(); // "{page}"
```

### Find the route with the highest number of set properties

If multiple routes have all of their properties set, the route with the highest number of set properties will be used:

```js
route('{page}');
route('{page}/{section}');
route.start();

route.data.page = 'two';
route.data.section = 'a';

route.matched(); // "{page}/{section}"
```

### Find the route that was registered first

If multiple routes are still matched, the route that was registered first will be matched:

```js
route('', { page: 'home' });
route('{section}');
route.start();

route.data.page = 'home';
route.data.section = 'a';

route.matched(); // ""
```
