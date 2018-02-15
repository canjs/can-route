@function can-route.register register
@parent can-route.static

@description Create a route matching rule.

@signature `route.register(rule [, defaults])`

Create a url matching rule. Optionally provide defaults that will be applied to the underlying [can-route.data] when the rule matches.

The following sets `route.data.page = "cart"` when the url is `#cart` and
`route.data.page = "home"` when the url is `#`.

```js
route.register( "{page}", { page: "home" } );
```

@param {String} rule the fragment identifier to match.  The fragment identifier should contain characters (a-Z), optionally wrapped in braces ( { } ). Identifiers wrapped in braces are interpreted as being properties on can-route’s map. Examples:

```js
route.register( "{foo}" );
route.register( "foo/{bar}" );
```

@param {Object} [defaults] An object of default values. These defaults are applied to can-route’s map when the route is matched.

@return {Object} The internal route object.  Use values on this object with caution. It is
 subject to change.
