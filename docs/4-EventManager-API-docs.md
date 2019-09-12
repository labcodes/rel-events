# EventManager API docs

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

### For RequestEvents

For a RequestEvent, the EventManager is required to have an `initialState` and implement 4 methods: `onRequest`, `onSuccess`, `onFailure` and `call`.

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

#### EventManager.onRequest, EventManager.onSuccess, EventManager.onFailure

These three methods receive the same data (state, event), but are called at different times.

- `onRequest`: called as soon as the request starts. Useful for rendering intermediate states, like loading spinners;
- `onSuccess`: called when the request promise is successfully resolved;
- `onFailure`: called when the request promise is rejected.

```js
export class LoginRequestEventManager {
  initialState = { isLoading: false, username: 'Anonymous' };

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
- `afterSuccess` and `afterFailure`: called after a RequestEvent finishes calling `onSuccess` and `onFailure` respectively.

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
