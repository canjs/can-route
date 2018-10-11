@function can-route.stop stop
@parent can-route.static
@release 4.1

@description Stops listening to the [can-route.data] observable and tears down any setup bindings.

@signature `route.stop()`

  Stops listening to changes in the URL as well as the observable defined in [can-route.data], and removes the current binding.

  ```html
  <mock-url></mock-url>
  <script type="module">
  import "//unpkg.com/mock-url@^5.0.0";
  import {route} from "can";

  route.register("{page}", { page: "" });
  route.start();
  route.data.page = "home";

  // Changing the route is not synchronous
  setTimeout(() => {
    route.stop();
    route.data.page = "cart"; // hash is still "home"
    console.log( location.hash ) //-> "#!home"
  }, 1000);

  </script>
  ```
  @codepen

  @return {can-route} The can-route object.

@body

## Use

If you need to disconnect an observable from the URL, call stop.
To reconnect, call [can-route.start] again.

```html
<mock-url></mock-url>
<script type="module">
import "//unpkg.com/mock-url@^5.0.0";
import {route} from "can";

route.register("{page}", { page: "" });
route.start();
route.stop();
route.data.page = "home"; // doesn't goto home

setTimeout(() => {
  route.start();
  route.data.page = "cart"; // hash routes to cart.
}, 3000);

</script>
```
@codepen
