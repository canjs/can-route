@function can-route.currentRule currentRule
@parent can-route.static
@description A compute representing the currently matched routing rule route.

@signature `route.currentRule()`
@return {String} The currently matched [can-route.register registered] routing rule.

@body

## Use

Use `route.currentRule()` to find the current route rule.

```js
route.register( "{type}", { type: "foo" } );
route.register( "{type}/{subtype}" );
route.currentRule(); // "{type}"
route.data.subtype = "foo";
route.currentRule(); // "{type}/{subtype}"
```
