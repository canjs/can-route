@property {Object|HTMLElement} can-route.data data
@parent can-route.static

An observable key-value object used to cross bind to the url observable [can-route.urlData]. Set it to cross-bind a top level state object (Application ViewModel) to [can-route].

@type {Object} If `route.data` is set to a [can-reflect]ed observable object of
key-value pairs, once [can-route.start] is called, changes in `route.data`'s
properties will update the hash and vice-versa.

  ```html
  <mock-url></mock-url>
  <script type="module">
  import {DefineMap, route} from "can";
  import "//unpkg.com/mock-url@^5.0.0/mock-url.mjs";

  route.data = new DefineMap( {page: ""} );
  route.register( "{page}" );
  route.start();

  location.hash = "#!example";

  setTimeout(()=> {
    console.log( route.data ); //-> {page: "example"}
  }, 100);
  </script>
  ```
  @codepen


@type {HTMLElement} If `route.data` is set to an element, its
observable [can-view-model] will be used as the observable connected
to the browser's hash.

  <section class="warnings">
    <div class="deprecated warning">
    <h3>Deprecated</h3>
    <div class="signature-wrapper">
    <p>Assigning an [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) to `route.data` has been deprecated in favor of setting it to an observable. If you have any further questions please refer to the [guides/routing Routing] guide.
    </div>
    </div>
  </section>

@body

For in-depth examples see the the [guides/routing Routing] guide.

## Background

One of the biggest challenges in a complex application is getting all the different parts of the app to talk to each other simply, cleanly, and reliably.

An elegant way to solve this problem is using the [Observer Pattern](http://en.wikipedia.org/wiki/Observer_pattern). A single object, which can be called [Application ViewModel](https://www.youtube.com/watch?v=LrzK4exG5Ss), holds the high level state of the application.

## Use

Setting `route.data` is an easy way to cross-bind your Application ViewModel object to `route`. This will serialize your Application ViewModel into the hash (or pushstate URLs).

```js
import {DefineMap} from "can";

const ViewModel = DefineMap.extend( {
  petType: "string",
  storeId: "number"
} );

const viewModel = new ViewModel( {
  petType: "string",
  storeId: "number"
} );

route.data = viewModel;
```

`route.data` can also be set to a constructor function. A new instance will be created and bound to:

```js
import {DefineMap, route} from "can";

const ViewModel = DefineMap.extend( {
  page: {
    type: "string",
    set( page ) {
      if ( page === "user" ) {
        this.verifyLoggedIn();
      }
      return page;
    }
  }
} );

route.data = ViewModel;
```

## When to set it

Set `route.data` at the  start of the application lifecycle, before any calls to `route.addEventListener`. This will allow events to correctly bind on this new object.

## Demo

The following shows creating an Application ViewModel that loads data at page load, has a virtual property 'locationIds' which serializes an array, and synchronizes the viewModel to can-route:

@demo demos/can-route/data.html

## Why

The Application ViewModel object, which is cross-bound to the can-route via `route.data` and represents the overall state of the application, has several obvious uses:

* It is passed into the various components and used to communicate their own internal state.
* It provides deep linking and back button support. As the URL changes, Application ViewModel changes cause changes in application components.
* It provides the ability to "save" the current state of the page, by serializing the Application ViewModel object and saving it on the backend, then restoring with that object to load this saved state.
