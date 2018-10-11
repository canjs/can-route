@function can-route.deparam deparam
@parent can-route.static

@description Extract data from a route path.

@signature `route.deparam(url)`

Extract data from a url, creating an object representing its values.

```js
route.register("{page}");

const result = route.deparam("page=home");
console.log(result.page); // -> "home"
```

@param {String} url A route fragment to extract data from.
@return {Object} An object containing the extracted data.

@body

Creates a data object based on the query string passed into it. This is
useful to create an object based on the `location.hash`.

```js
route.deparam("id=5&type=videos");
  // -> { id: 5, type: "videos" }
```

It's important to make sure the hash or exclamation point is not passed
to `route.deparam` otherwise it will be included in the first property's
name.

```js
route.data.id = 5 // location.hash -> #!id=5
route.data.type = "videos"
  // location.hash -> #!id=5&type=videos
route.deparam(location.hash);
  // -> { #!id: 5, type: "videos" }
```

`route.deparam` will try and find a matching route and, if it does,
will deconstruct the URL and parse out the key/value parameters into the
data object.

```js
route.register("{type}/{id}");

route.deparam("videos/5");
  // -> { id: 5, route: "{type}/{id}", type: "videos" }
```
