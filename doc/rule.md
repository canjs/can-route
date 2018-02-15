@function can-route.rule rule
@parent can-route.static
@description Get the routing rule that matches a url.


@signature `route.rule(url)`

```js
route.register( "recipes/{recipeId}" );
route.register( "tasks/{taskId}" );
route.rule( "recipes/5" ); //-> "recipes/{recipeId}"
```

@param {String} url A url or url fragment.

@return {String|undefined} Returns the [can-route.register registered] routing rule
that best matches the provided url.  If no rule matches, `undefined` is returned.



@body
