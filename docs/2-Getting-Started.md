# Getting started

With our library installed, we need to set up a couple of things.

First, be sure to add our `eventsMiddleware` to your app's redux store when creating it. It does require you to have `redux` and `redux-thunk` installed.

```js
import thunk from 'redux-thunk';
import { eventsMiddleware } from 'rel-events';
import { createStore, applyMiddleware } from 'redux';

import rootReducer from './myAppRootReducers';

export const store = createStore(
  rootReducer,
  applyMiddleware(thunk, eventsMiddleware),
);
```

With that done, we may start to create some events!

### Creating a basic Event

Let's say you want to pass a range of dates from `DatePickerComponent` to `CalendarComponent`. Instead of creating actions and reducers, we will forget everything about redux and create an Event.

To do that, we recommend creating a new file (`events.js`) and initializing a new Event.

```js
import { Event } from 'rel-events';

export const ChooseDateRangeEvent = new Event({
  name: 'chooseDateRange',
  manager: {
    initialState: {},
    onDispatch: (state, event) => {
      return {
        ...state,
        startDate: event.startDate,
        endDate: event.endDate,
      }
    }
  }
});
```

Let's break step-by-step what this code means:

First, we import the Event class from our lib, then que instantiate a new event. This event receives an object with two required keys: `name` and `manager`. While `name` is self-explanatory, `manager` is not.

For default events, an event manager should have an `initialState` and implement an `onDispatch` method, which will be called whenever the event is dispatched. This is the alternative to the reducer part of the default redux flow.

We recommend using classes for your EventManagers as well, since we can decouple Events from their managers.

```js
export class ChooseDateRangeEventManager {
  initialState = {};

  onDispatch = (state, event) => {
      return {
        ...state,
        startDate: event.startDate,
        endDate: event.endDate,
      }
    }
  }
}
```

Then:

```js
import { Event } from 'rel-events';
import { ChooseDateRangeEventManager } from './eventManagers.js';

export const ChooseDateRangeEvent = new Event({
  name: 'chooseDateRange',
  manager: new ChooseDateRangeEventManager(),
);
```

### Hooking it up with redux

With the event instantiated, we need to hook it up to redux so it can be dispatched and save data. When creating your root reducer, you should import the Event and initialize its reducers.

```js
// on myAppRootReducers.js
import { combineReducers } from 'redux';
import { ChooseDateRangeEvent } from './events.js';

// remember to use object spread, so it's set up correctly
export default combineReducers({
  ...ChooseDateRangeEvent.createReducers(),
});
```

Notice we're not declaring store names and reducers anymore; we don't need to. Any Event object will deal with anything and everything redux related. To be able to do that, we need to hook it to redux as the example above. To see more on how this works, read our [how it works docs](https://github.com/labcodes/rel-events/tree/master/docs/7-How-it-works.md).

Now we have our Event ready to go! Now, we just need to register it to a Component, which can trigger it and/or listen to it.

### Registering components to Events

Let's say we have a component called `DatePickerComponent` that knows how to render a beautiful date picker. It has a `handleDatesChange` method to update the state with the new dates.

```jsx
export default class DatePickerComponent extends React.Component {
  //...
  handleDatesChange = (startDate, endDate) => {
    this.setState({ startDate, endDate });
  }
  //...
}
```

To be able to send data from this component to the `CalendarComponent`, we register both Components to our Event. Whenever we register a Component to an Event, we automatically receive a function to trigger the event as a prop. The function's name is the same as the event name you passed when initializing the event.

```jsx
import { ChooseDateRangeEvent } from './events.js';

// we won't export the component directly anymore
class DatePickerComponent extends React.Component {
  //...
  handleDatesChange = (startDate, endDate) => {
    // here, we trigger the event passing the new dates
    // after setState is done
    this.setState(
      { startDate, endDate },
      () => this.props.chooseDateRange({ startDate, endDate })
    );
  }
  //...
}

// and here, we register the component to the event.
// since Components are mostly named with CamelCase,
// we preferred to name the key like that as well
export default ChooseDateRangeEvent.register({
  Component: DatePickerComponent,
})
```

Then, we register our `CalendarComponent` as well, but passing a new `props` key:

```jsx
import { ChooseDateRangeEvent } from './events.js';

class CalendarComponent extends React.Component {
  //...
  render(){
    const { startDate, endDate } = this.props;

    return <h1>The dates are: {startDate}, {endDate}</h1>
  }
}

// and here, we get the props from the event
export default ChooseDateRangeEvent.register({
  Component: CalendarComponent,
  props: ['startDate', 'endDate'],
})
```

And that's it! We have a lot of other features to discuss, but I'll talk about those later. Before that, let's talk about using events to make HTTP requests.

## Creating a RequestEvent

The idea behind this library is to make data management easy and semantic, so we thought it would be best to include a special type of Event for making HTTP requests.

A `RequestEvent` is the very same as the basic `Event`, but instead of having a manager with an `onDispatch` method, we'll need to implement 4 methods: `onRequest`. `onSuccess`, `onFailure` and `call`.

```js
// on eventManagers.js
import { fetchFromApi } from 'rel-events';

export class LoginRequestEventManager {
  initialState = { isLoading: false, username: 'Anonymous' };

  call = (user) => () => fetchFromApi(
    '/api/login',
    { method: 'POST', body: JSON.stringify(user) }
  )

  onRequest = (state, event) => ({
    ...state,
    isLoading: true,
    username: this.initialState.username
  })

  onSuccess = (state, event) => ({
    ...state,
    isLoading: false,
    username: event.response.data.username,
  })

  onFailure = (state, event) => ({
    ...state,
    isLoading: false,
    username: this.initialState.username,
    error: event.error.data,
  })
}

// on events.js
import { RequestEvent } from 'rel-events';
import { LoginRequestEventManager } from './eventManagers.js';

// notice we're using a RequestEvent instead of a regular Event
export const LoginRequestEvent = new RequestEvent({
  name: 'login',
  manager: new LoginRequestEventManager(),
});
```

Just a couple of notes about the `call` method:

Since this is a `RequestEvent`, `call` needs to return a function, which will be called by our middleware to fetch the data. We use the middleware and fetch helper from [`react-redux-api-tools`](https://github.com/labcodes/react-redux-api-tools), so I'd suggest you at least take a look at their docs if you want to use `RequestEvent`s. If, for example, you prefer to use `axios`, just remove `fetchFromApi` and replace it with your `axios` code.

**Disclaimer:** If you're going to use fetch, please use the `fetchFromApi` helper, or all `4xx` responses will trigger the `onSuccess` handler ([because fetch does not reject 4xx requests by default](https://www.tjvantoll.com/2015/09/13/fetch-and-errors/)).

And remember to hook up the event on redux and register your components!

```js
// on myAppRootReducers.js
import { combineReducers } from 'redux';
import { ChooseDateRangeEvent, LoginRequestEvent } from './events.js';

export default combineReducers({
  ...ChooseDateRangeEvent.createReducers(),
  ...LoginRequestEvent.createReducers(), // <<< new line here
});

// on LoginComponent.js
import { LoginRequestEvent } from './events.js';

class LoginComponent extends React.Component {
  //...
  handleFormSubmit = ({ email, username }) => this.props.login({ email, username });
  // ...
}

export default LoginRequestEvent.register({ Component: LoginComponent });
```

## Other features and goodies

### Event Chaining - Making Events listen to Events

Sometimes, we want to make an Event be triggered by the completion of another. Let's imagine that, after logging in an user, we need to go somewhere to get the user's data.

Assuming you've implemented the `LoginRequestEvent` as the example above, you'll need to implement your new Event and EventManager to fetch the user's data. After implementing, you just need to pass the `listenTo` key to your new event.

```js
// on events.js
import { RequestEvent } from 'rel-events';
import { LoginRequestEventManager, FetchUserDataRequestEventManager } from './eventManagers.js';

export const LoginRequestEvent = new RequestEvent({
  name: 'login',
  manager: new LoginRequestEventManager(),
});

// to chain an event to another, declare the `listenTo` key.
// and, yes, you may make an event listen to multiple events.
// be careful not to pass the direct reference to LoginRequestEvent;
// pass a function that returns it instead.
export const FetchUserDataRequestEvent = new RequestEvent({
  name: 'fetchUserData',
  manager: new FetchUserDataRequestEventManager(),
  listenTo: [
    { event: () => LoginRequestEvent, trigger: 'onSuccess' },
  ]
});
```

That means that, whenever the login is successful, `fetchUserData` will be triggered by calling `FetchUserDataRequestEventManager.call` passing the data from the `LoginRequestEvent.onSuccess` return.

**One caveat** is that the `event` value is **not** a direct reference to the Event that will be listened to. Instead, it's a function that returns the reference. That's needed because we could be using multiple files for multiple Events, and, if we do, we can't guarantee that `FetchUserDataRequestEvent` will be loaded into memory before `LoginRequestEvent`. If that happened, the `event` value would be `undefined`, so we chose to receive a function instead.

### `shouldDispatch` optional method - helped by the `getCurrentStateFromEvent` helper

If you're dealing with a situation in which you don't want to dispatch an event based on certain conditions, you should probably implement a `shouldDispatch` method on your event manager.

Imagine a scenario in which you don't want to dispatch an event if the data is the same it was before. I'll be using the `ChooseDateRangeEvent` (seen above) as an example.

Let's say that you don't want `ChooseDateRangeEvent` to be dispatched if the dates are the same. An example on how we would achieve that would be as follows:

```js
// on eventManagers.js
import { getCurrentStateFromEvent } from 'rel-events';
import { ChooseDateRangeEvent } from './events';

class ChooseDateRangeEventManager {

  //...

  shouldDispatch = (appState, event) => {
    const currentState = getCurrentStateFromEvent({
      event: ChooseDateRangeEvent,
      appState: appState,
    });
    // returns { startDate, endDate }

    return (
      currentState.startDate !== event.startDate
      && currentState.endDate !== event.endDate
    );
  }

  // ...

}
```

The `shouldDispatch` method receives the whole app state (containing data from all events) and the event that would be dispatched. If `shouldDispatch` returns `true`, the event is dispatched.

Since we don't want to leak the implementation details from the reducer layer, we provide the `getCurrentStateFromEvent` helper. It returns all the relevant data from an Event, so you can compare it to the event that will be dispatched.

And yes, you may use `shouldDispatch` in any way you want. You may want to check a cookie, or data from other events, or localStorage, or the value of a variable, whatever; it only cares that you return a truthy or falsy value. By default, it always returns `true`.

### `afterDispatch`, `afterSuccess` and `afterFailure`

Sometimes, all we want is to run some code after the new state from an event is set. For these cases, you may want to implement an `afterDispatch` method in your manager (for regular Events) or `afterSuccess`/`afterFailure` (for RequestEvents).

```js
// on eventManagers.js
import * as Sentry from '@sentry.browser';

class ChooseDateRangeEventManager {

  //...

  afterDispatch = (previousState, newState) => {
    if (previoustState.isValid && newState.isInvalid) {
      Sentry.captureMessage('Something went wrong');
    }
  }

  // ...

}
```

## Phew, that was a LOT

Yep. This guide tries to give you all the rel-evant information you need to know to use `rel-events`. If you're interested on more specific info, [take a look at our API docs](https://github.com/labcodes/rel-events/tree/master/docs/README.md), and if you're curious to know how the hell this works, take a look at our [How it works](https://github.com/labcodes/rel-events/tree/master/docs/6-How-it-works.md) guide or [jump into the source code](https://github.com/labcodes/rel-events/tree/master/)!
