@function can-route.isCurrent isCurrent
@parent can-route.static

@description Check if data represents the current route.

@signature `route.isCurrent(data [,subsetMatch] )`

  Compares `data` to the current route. Used to verify if an object is
  representative of the current route.

  ```js
  import {route} from "//unpkg.com/can@5/core.mjs";

  route.data =  {page: "recipes", id: "5"};
  route.start();

  setTimeout(() => {
    const completeSet = route.isCurrent( {page: "recipes"} );
    console.log( completeSet ); //-> false

    const subSet = route.isCurrent( {page: "recipes"}, true );
    console.log( subSet ); //-> true
  }, 200);
  ```
  @codepen

  @param {Object} data Data to check against the current route.
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
import {route} from "//unpkg.com/can@5/core.mjs";

route.data = {};
route.data.id = 5; // location.hash -> "#!&id=5"
route.start();

setTimeout(() => {
  const currentId = route.isCurrent( { id: "5" } );
  console.log(currentId); // -> true

  const checkFullRoute = route.isCurrent( {id: 5, type: "videos"} );
  console.log(checkFullRoute); // -> false
  
  route.data.type = "videos";
  route.start();
}, 100);

setTimeout(() => {
  const checkFullRoute = route.isCurrent( {id: 5, type: "videos" } );
  console.log( checkFullRoute ); //-> true
}, 200);

```
@codepen
