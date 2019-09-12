
# `Event` and `RequestEvent` API docs

These API docs are literally the same for `Event` and `RequestEvent` classes. The only parameter that needs to change is the EventManager. For more info on EventManagers, take a look at the [EventManager docs](https://github.com/labcodes/rel-events/tree/master/docs/4-EventManager-API-docs.md).

### Event initialization

Initializes a new Event/RequestEvent instance.

```js
new Event({ name: String, manager: Object, listenTo: Array.of(Object) });

// example:
const ChooseDateRangeEvent = new Event({
  name: 'chooseDateRange',
  manager: {
    // refer to EventManager API docs
  },
  listenTo: [
    {
      event: () => Event/RequestEvent instance,
      trigger: String(depends on the event being listened: 'onDispatch' for normal Events, 'onRequest'/'onSuccess'/'onFailure' for RequestEvents)
    }
  ]
});
```

### Event.register

Registers a Component to an Event/RequestEvent, injecting data defined on the 'props' key and a function of the event.name to trigger the event.

```js
// returns a wrapped component, same as redux's connect()
EventInstance.register({
  Component: React.Component,
  props: Array.of(String)
});

// example:

// on events.js
import { RequestEvent } from 'rel-events';
import { LoginRequestEventManager } from './eventManagers.js';

export const LoginRequestEvent = new RequestEvent({
  name: 'login',
  manager: new LoginRequestEventManager(),
});

// on LoginComponent.js
import { LoginRequestEvent } from './events';

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

export default LoginRequestEvent.register({
  Component: LoginComponent,
  props: ['username', 'error']
});
```

### Event.createReducers

Binds an Event/RequestEvent to redux via reducers. Returns an object like `{ eventName(String): reducers(Function) }`.

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

### Event.toRedux

"Serializes" data in a way that redux knows how to dispatch. Receives an object and returns an object. Mostly used internally. Unsafe.

```js
EventInstance.toRedux({ data });
// returns an object of { type: formatted event.name, shouldDispatch: Function -> Boolean,  ...data }

// example:
ChooseDateRangeEvent.toRedux({ startDate: new Date, endDate: new Date });
// returns { type: 'CHOOSE_DATE_RANGE', shouldDispatch: () => true, startDate, endDate }
```
