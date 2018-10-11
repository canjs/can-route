@function can-route.param param
@parent can-route.static

@description Get a route path from given data.

@signature `route.param(data)`
@param {data} object The data to populate the route with.
@param {String} [currentRouteName] The current route name.  If provided, this can be used to "stick" the url to a previous route. By "stick", we mean that if there are multiple registered routes that match the `object`, the the `currentRouteName` will be used.

@return {String} The route, with the data populated in it.

@body

Parameterizes the raw JS object representation provided in data.

```js
route.param({ type: "video", id: 5 });
  // -> "type=video&id=5"
```

If a route matching the provided data is found, that URL is built
from the data. Any remaining data is added at the end of the
URL as &amp; separated key/value parameters.

```js
route.register("{type}/{id}");

route.param({ type: "video", id: 5 }) // -> "video/5"
route.param({ type: "video", id: 5, isNew: false })
  // -> "video/5&isNew=false"
```