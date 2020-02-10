
# API docs

Here, we have the API docs for our public API.

- [`Event` and `HTTPEvent` API docs](#event-and-httpevent-api-docs)
- [`EventManager` API docs](#eventmanager-api-docs)
- [`getCurrentStateFromEvent` API docs](#getcurrentstatefromevent-api-docs)

---------------------------------------

## `Event` and `HTTPEvent` API docs

These API docs are literally the same for `Event` and `HTTPEvent` classes. The only parameter that needs to change is the EventManager. For more info on EventManagers, take a look at the [EventManager docs](https://github.com/labcodes/rel-events/tree/master/docs/4-EventManager-API-docs.md).

### Event initialization

Initializes a new Event/HTTPEvent instance.

```js
new Event({
  name: String.isRequired,
  manager: Object.isRequired,
  useDataFrom: String,
  listenTo: Array.of(Object),
  debounce: Boolean,
  debounceDelay: Number,
});

// example:
const ChooseDateRangeEvent = new Event({
  name: 'chooseDateRange',
  useDataFrom: 'otherEvent',
  manager: {
    // refer to EventManager API docs
  },
  listenTo: [
    {
      event: () => Event/HTTPEvent instance,
      triggerOn: String(depends on the event being listened: 'dispatch' for normal Events, 'dispatch'/'success'/'failure' for HTTPEvents),
      autocompleteCallArgs: true,
    }
  ],
  debounce: true,
  debounceDelay: 500,
});
```

### Event.register

Registers a Component to an Event/HTTPEvent, injecting data defined on the 'props' key and a function of the event.name to trigger the event.

```js
// returns a wrapped component, same as redux's connect()
EventInstance.register({
  Component: React.Component,
  props: Array.of(String)
});

// example:

// on events.js
import { HTTPEvent } from 'rel-events';
import { LoginHTTPEventManager } from './eventManagers.js';

export const LoginHTTPEvent = new HTTPEvent({
  name: 'login',
  manager: new LoginHTTPEventManager(),
});

// on LoginComponent.js
import { LoginHTTPEvent } from './events';

class LoginComponent extends React.Component {
  //...
  handleFormSubmit = ({ email, username }) => this.props.login({ email, username });
  // ...
  render(){
    const { username, error } = this.props;

    if (error){
      // renders error
    }

    return <h1>Hi {username}!</h1>
  }
}

export default LoginHTTPEvent.register({
  Component: LoginComponent,
  props: ['username', 'error']
});
```

### Event.createReducers

Binds an Event/HTTPEvent to redux via reducers. Returns an object like `{ eventName(String): reducers(Function) }`.

```js
EventInstance.createReducers();

// example:
import { combineReducers } from 'redux';
import { ChooseDateRangeEvent } from './events.js';

// remember to use object spread, so it's set up correctly
export default combineReducers({
  ...ChooseDateRangeEvent.createReducers(),
  // returns { 'chooseDateRange': (state, action) => { ... } }
});
```

---------------------------------------

## EventManager API docs

EventManagers are implementations of how an event will behave through its lifecycle. They implement different methods based on the type of event it's bound to and on the needs of the use case.

### For regular Events

For an Event, the EventManager is required to implement an `onDispatch` method, as well as an `initialState` for the Event.

#### EventManager.onDispatch

Receives the current state of the Event and the new dispatched event. Returns a new Event state. It's basically a mirror of a reducer.

```js
class ChooseDateRangeEventManager {
  initialState = {
    startDate: new Date(),
    endDate: new Date(),
  }

  onDispatch = (state, event) => ({
    ...state,
    startDate: event.startDate,
    endDate: event.endDate
  })
}
```

### For HTTPEvents

For a HTTPEvent, the EventManager is required to have an `initialState` and implement 4 methods: `onDispatch`, `onSuccess`, `onFailure` and `call`.

#### EventManager.call

Called whenever an event is triggered. Receives an object with data. Returns a function that, when called, makes a HTTP request. The HTTP function needs to return a Promise.

```js
import { fetchFromApi } from 'rel-events';

class LoginEventManager {
  // ...
  call = ({ username, password }) => () => fetchFromApi(
    '/api/login',
    { method: 'POST', body: JSON.stringify({ username, password }) }
  );
  // ...
}
```

#### EventManager.onDispatch, EventManager.onSuccess, EventManager.onFailure

These three methods receive the same data (state, event), but are called at different times.

- `onDispatch`: called as soon as the request starts. Useful for rendering intermediate states, like loading spinners;
- `onSuccess`: called when the request promise is successfully resolved;
- `onFailure`: called when the request promise is rejected.

```js
export class LoginHTTPEventManager {
  initialState = { isLoading: false, username: 'Anonymous' };

  onDispatch = (state, event) => ({
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
```

For more info on how the response objects work, refer to [`react-redux-api-tools` docs](https://github.com/labcodes/react-redux-api-tools).

### Optional methods

#### EventManager.shouldDispatch

`shouldDispatch` is called before an event is dispatched. If it returns `true`, the event is dispatched. Receives the whole appState and the event to be dispatched. Returns a Boolean. Mostly used together with `getCurrentStateFromEvent`.

```js
import { getCurrentStateFromEvent } from 'rel-events';

class ChooseDateRangeEventManager {
  //...
  shouldDispatch = (appState, event) => {
    const currentState = getCurrentStateFromEvent({
      event: ChooseDateRangeEvent,
      appState: appState,
    });

    return (
      currentState.startDate !== event.startDate
      && currentState.endDate !== event.endDate
    );
  }
  // ...
}
```

#### EventManager.afterDispatch, EventManager.afterSuccess, EventManager.afterFailure

These optional methods acre called after other EventManager methods, and depend on the type of Event you're binding the EventManager to. All of them receive the previousState and the newState as arguments.

- `afterDispatch`: called after a regular Event finished calling the `onDispatch` method;
- `afterSuccess` and `afterFailure`: called after a HTTPEvent finishes calling `onSuccess` and `onFailure` respectively.

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

---------------------------------------

## `getCurrentStateFromEvent` API docs

`getCurrentStateFromEvent` is only supposed to be used inside `shouldDispatch` methods from EventManagers. They receive the state of all the events (the `appState`) and returns data concerning a specific Event.

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
    // returns { startDate: Date, endDate: Date }, for example

    return (
      currentState.startDate !== event.startDate
      && currentState.endDate !== event.endDate
    );
  }

  // ...

}
```
