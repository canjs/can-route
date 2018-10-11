@function can-route.currentRule currentRule
@parent can-route.static
@description A compute representing the currently matched routing rule route.

@signature `route.currentRule()`
  Use `route.currentRule()` to find the current route rule.

  ```js
  import {route} from "can";
  route.register( "{type}", { type: "foo" } );
  route.register( "{type}/{subtype}" );
  console.log( route.currentRule() ); //-> "{type}"
  route.data.subtype = "bar";
  console.log( route.currentRule() ); //-> "{type}/{subtype}"
  ```
  @codepen

  @return {String} The currently matched [can-route.register registered] routing rule.
