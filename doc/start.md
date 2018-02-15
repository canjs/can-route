@function can-route.start start
@parent can-route.static
@release 3.3

Initializes can-route.

@signature `route.start()`

Sets up the two-way binding between the hash and the can-route observable
map and sets the route map to its initial values.

```js
route.register( "{page}", { page: "home" } );
route.start();
route.data.page; // -> "home"
```

@return {can-route} The can-route object.

@body

## Use

After setting all your routes, call `route.start()`.

```js
route.register( "overview/{dateStart}-{dateEnd}" );
route.register( "{type}/{id}" );
route.start();
```
