@function can-route.isCurrent isCurrent
@parent can-route.static

Check if data represents the current route.

@signature `route.isCurrent(data [,subsetMatch] )`

Compares `data` to the current route. Used to verify if an object is
representative of the current route.

```js
route.data.set({page: "recipes", id: '5'});

route.isCurrent({page: "recipes"});       //-> false
route.isCurrent({page: "recipes"}, true); //-> true
```

  @param {Object} data Data to check agains the current route.
  @param {Boolean} [subsetMatch] If true, `route.current` will return true
  if every value in `data` matches the current route data, even if
  the route data has additional properties that are not matched.  Defaults to `false`
  where every property needs to be present.
  @return {Boolean} Whether the data matches the current URL.

@body

## Use

Checks the page's current URL to see if the route represents the options
passed into the function.

Returns true if the options represent the current URL.

```js
route.data.id = 5; // location.hash -> "#!id=5"
route.isCurrent({ id: 5 }); // -> true
route.isCurrent({ id: 5, type: 'videos' }); // -> false

route.data.type = 'videos';
  // location.hash -> #!id=5&type=videos
route.isCurrent({ id: 5, type: 'videos' }); // -> true
```
