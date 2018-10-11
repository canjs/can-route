@function can-route.link link
@parent can-route.static

@description Creates a string representation of an anchor link using data and the registered routes.

@signature `route.link(innerText, data, props [, merge])`

Make an anchor tag (`<a>`) that when clicked on will update can-route's
properties to match those in `data`.

@param {Object} innerText The text inside the link.
@param {Object} data The data to populate the route with.
@param {Object} props Properties for the anchor other than `href`.
@param {Boolean} [merge] Whether the given options should be merged into the current state of the route.
@return {String} A string with an anchor tag that points to the populated route.

@body
Creates and returns an anchor tag with an href of the route
attributes passed into it, as well as any properties desired
for the tag.

```js
route.link( "My videos", { type: "videos" }, {}, false )
  // -> <a href="#!type=videos">My videos</a>
```

Other attributes besides href can be added to the anchor tag
by passing in a data object with the attributes desired.

```js
route.link( "My videos", { type: "videos" },
  { className: "new" }, false )
    // -> <a href="#!type=videos" class="new">My Videos</a>
```

It is possible to utilize the current route options when making anchor
tags in order to make your code more reusable. If merge is set to true,
the route options passed into `canRoute.link` will be passed into the
current ones.

```js
location.hash = "#!type=videos"
route.link( "The zoo", { id: 5 }, true )
  // -> <a href="#!type=videos&id=5">The zoo</true>

location.hash = "#!type=pictures"
route.link( "The zoo", { id: 5 }, true )
  // -> <a href="#!type=pictures&id=5">The zoo</true>
```
