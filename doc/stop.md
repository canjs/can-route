@function can-route.stop stop
@parent can-route.static
@release 4.1

Stops listening to the [can-route.data] observable and tears down any setup bindings.

@signature `route.stop()`

Stops listening to changes in the URL as well as the observable defined in [can-route.data], and removes the current binding.

```js
route.register( "{page}", { page: "home" } );
route.start();
route.data.page = "home";
route.stop();
route.data.page = "cart"; // hash is still #home
```

@return {can-route} The can-route object.

@body

## Use

If you need to disconnect an observable from the URL, call stop:

```js
route.stop();
```

To reconnect, call [can-route.start] again.
