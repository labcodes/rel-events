# How it works

<center><img src="https://media.tenor.com/images/796b5aa6ed8ede41602c8fe2679dc8a1/tenor.gif"/></center>

`rel-events` is a small, thin layer over `redux`, and aims to present a more compelling, simple API to deal with data on `react` apps. We at Labcodes value code readability and low cognitive burden, and we believe that code needs to be as simple as it gets.

To do that, both the Event and the HTTPEvent classes, together with `react-redux-api-tools`' middleware, contain all the repetitive and verbose logic from redux.

When we create a new Event, it gets ready to give redux what it needs, when it needs it:

- first, it offers the `createReducers` method, which gives redux the *store name*, the *action names* and the *reducer handlers* for a specific Event, so you don't need to repeat reducers names anywhere;
- then, it offers the `fetchFromApi` helper and the `apiMiddleware` from `react-redux-api-tools` as its own, so you don't need to know about multiple packages. The middleware is the one that does all the heavy lifting inside redux for it to do that it needs to do when dealing with HTTP requests;
- finally, we wrap redux's `connect` inside the `register` method, so people stop being confused with weird and repetitive declarations from `mapStateToProps`, `mapDispatchToProps`, `bindActionCreators`, etc.


So when you trigger an Event inside your Component, the following occurs:

- we pass the data you passed to it to the Event's `toRedux` method;
- the return is passed to redux's `dispatch`, which triggers redux's flow (this is the same as dispatching an action on redux);
- redux will trigger the reducer with the correct name, since we mapped the Event inside redux's reducers. That means that, as soon as the event is dispatched, the `onDispatch` method will be called;
- if the Event Manager has an `afterDispatch` method, it's async called;
- the store is updated with the new data.

If we're dealing with a HTTPEvent, the flow is a little bit more complicated:

- it executes the event as described above, (so it calls the `onDispatch` method and persists it's data inside redux's store);
- then, it triggers the `call` method to begin the request. Internally, it saves the request promise on memory and awaits for it. This is done entirely by `react-redux-api-tools`' middleware;
- as soon as the request is done, the request promise is evaluated. If it's resolved, the `onSuccess` reducer is called - if not, `onFailure` is called;
- with the new data at hand, it checks if there are any `afterSuccess` or `afterFailure` methods on the Event Manager. If so, it async calls them accordingly;
- finally, each event checks if they are listening to this specific reducer and, if so, it async dispatches itself, passing the new data. The new data then is saved on redux's store.

The final flow is something like this. The middle bubbles are, well, the middleware:

<img src="data flow.png"/>

If you still want to better understand this lib, I really invite you to check out the source code from the Event and HTTPEvent so you understand better the pros and cons to this approach. :)

And if you want to understand the whys, take a look at [our blog post about that](https://labcodes.com.br/blog/en/decoupling-logic-from-react-components.html)! Thanks <3
