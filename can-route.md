@function can-route can-route
@group can.route.static static
@inherits can-map
@download can/route
@test can-route/test.html
@parent canjs
@group can-route.plugins plugins
@link ../docco/route/route.html docco

@description Manage browser history and
client state by synchronizing the window.location.hash with
a [can-map].

@signature `route(template [, defaults])`

Create a route matching rule. Optionally provide defaults that will be applied to the [can-map] when the route matches.

```js
route(":page", { page: "home" });
```

Will apply **cart** when the url is `#cart` and **home** when the url is `#`.

@param {String} template the fragment identifier to match.  The fragment identifier
should start with either a character (a-Z) or colon (:).  Examples:

```js
route(":foo")
route("foo/:bar")
```

@param {Object} [defaults] An object of default values.
@return {can.route}

@body

## Use

Watch this video for an overview of can.route's functionality and an example showing how to connect two tab widgets to the browser's history:

<iframe width="662" height="372" src="https://www.youtube.com/embed/ef0LKDiaPZ0" frameborder="0" allowfullscreen></iframe>

In the following CanJS community we also talk about web application routing:

<iframe width="662" height="372" src="https://www.youtube.com/embed/0Hhuv5Qru9k" frameborder="0" allowfullscreen></iframe>

## Background Information

To support the browser's back button and bookmarking
in an Ajax application, most applications use
the <code>window.location.hash</code>.  By
changing the hash (via a link or JavaScript), 
one is able to add to the browser's history 
without changing the page.

This provides the basics needed to
create history enabled Ajax websites.  However,
`route` addresses several other needs such as:

  - Pretty urls (actually hashes)
  - Keeping routes independent of application code
  - Listening to specific parts of the history changing
  - Setup / Teardown of widgets.

## How it works

<code>route</code> is a [can-map] that represents the
<code>window.location.hash</code> as an 
object.  For example, if the hash looks like:

    #!type=videos&id=5
    
the data in <code>route</code> looks like:

    { type: 'videos', id: 5 }


`route` keeps the state of the hash in-sync with the `data` contained within 
`route`.

## can-map

`can-route` is a [can-map]. Understanding
`can-map` is essential for using `can.route` correctly.

You can listen to changes in an Observe with `bind(eventName, handler(ev, args...))` and
change can-route's properties with 
[can.Map.prototype.attr attr].

### Listening to changes in can-route

Listen to changes in history 
by [can.Map.prototype.bind bind]ing to
changes in <code>can-route</code> like:

    route.bind('change', function(ev, attr, how, newVal, oldVal) {
    
    })

 - `attr` - the name of the changed attribute
 - `how` - the type of Observe change event (add, set or remove)
 - `newVal`/`oldVal` - the new and old values of the attribute

### Updating can-route

Create changes in the route data with [can.Map.prototype.attr attr] like:

    route.attr('type','images');

Or change multiple properties at once like:

    route.attr({type: 'pages', id: 5}, true)

When you make changes to can-route, they will automatically
change the <code>hash</code>.

## Creating a Route

Use <code>route(url, defaults)</code> to create a 
route. A route is a mapping from a url to 
an object (that is the route's state). 
In order to map to a specific properties in the url,
prepend a colon to the name of the property like:

    route("#!content/:type")


If no routes are added, or no route is matched, 
can-route's data is updated with the [can.deparam deparamed]
hash.

    location.hash = "#!type=videos";
    // route -> {type : "videos"}
    
Once routes are added and the hash changes,
can-route looks for matching routes and uses them
to update can-route's data.

    route("#!content/:type");
    location.hash = "#!content/images";
    // route -> {type : "images"}
    route.attr("type", "songs")
    // location.hash -> "#!content/songs"
    
Default values can be added to a route:

    route("content/:type",{type: "videos" });
    location.hash = "#!content/"
    // route -> {type : "videos"}
    // location.hash -> "#!content/"

Defaults can also be set on the root page of your app:

    route("", { page: "index" });
    location.hash = "#!";
    // route.attr() -> { page: "index" }
    // location.hash -> "#!"

## Initializing can-route

After your application has created all of its routes, call [route.ready]
to set can-route's data to match the current hash:

     route.ready()

## Changing the route.

Typically, you don't set <code>location.hash</code>
directly.  Instead, you can change properties on <code>route</code>
like:

    route.attr('type', 'videos')
    
This will automatically look up the appropriate 
route and update the hash.

Often, you want to create links.  <code>route</code> provides
the [route.link] and [route.url] helpers to make this 
easy:

    route.link("Videos", {type: 'videos'})

## Demo

The following demo shows the relationship between `window.location.hash`,
routes given to `can.data`,
`route`'s data, and events on `can.data`.  Most properties 
are editable so experiment!

@iframe can/route/demo.html 980

## IE Compatibility

Internet Explorer 6 and 7 does not support `window.onhashchange`. 
Even Internet Explorer 8 running in IE7 compatibility mode reports `true` 
for `onhashchange` in window, even though the event isn't supported.

If you are using jQuery, you can include Ben Alman's [HashChange Plugin](http://benalman.com/projects/jquery-hashchange-plugin/)
to support the event in the unsupported browser(s).
