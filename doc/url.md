@function can-route.url url
@parent can-route.static

@description Creates a URL fragment based on registered routes given a set of data.

@signature `route.url(data [, merge])`

Make a URL fragment that when set to window.location.hash will update can-route's properties
to match those in `data`.

```js
route.url({ page: "home" });
// -> "#!page=home"
```

@param {Object} data The data to populate the route with.
@param {Boolean} [merge] Whether the given options should be merged into
the current state of the route.
@return {String} The route URL and query string.

@body
Similar to [can-route.link], but instead of creating an anchor tag,
`route.url` creates only the URL based on the route options passed into it.

```js
route.url( { type: "videos", id: 5 } );
  // -> "#!type=videos&id=5"
```

If a route matching the provided data is found the URL is built from the
data. Any remaining data is added at the end of the URL as & separated
key/value parameters.

```js
route.register("{type}/{id}");

route.url( { type: "videos", id: 5 } ) // -> "#!videos/5"
route.url( { type: "video", id: 5, isNew: false } )
  // -> "#!video/5&isNew=false"
```
