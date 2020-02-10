
## Advanced Usage: Other features and goodies

### Using `extraData` on Event Managers

Whenever you call an Event/HTTPEvent, data that is passed to its 'call' or 'onDispatch' method is automatically added to the event instance in the `extraData` key.

That means that if, for example, you want to persist some data on an Event, you may just do this:

```js
// on eventManagers.js

export class ExampleEventManager {
  name: 'login',
  manager: {
    initialState: {},
    // just set a new key passing the event.extraData value
    onDispatch: (state, event) => ({ ...state, data: event.extraData })
  },
}

```

### Debouncing Events

It's not unusual to have a use case in which you don't really want to trigger the Event right away. When the user is typing some data into a text input, for example, we may want to wait for a certein amount of time so that the user has finished typing, and only then trigger the Event with the latest data.

Doing that inside a component may give you some undesirable effects. First of all the Component will need to implement the debouncing itself, and more code is more windows for errors. The redux flow will be oh so slightly off from the input change as well, which may lead to rendering issues when presenting the loading spinner, for example.

To deal with those cases, we provide an optional `debounce` and `debounceDelay` configurations. When instantiating the Event, you are able to do something like this:

```js
// on events.js
import { HTTPEvent } from 'rel-events';
import { SearchByUsernameHTTPEventManager } from './eventManagers.js';

export const SearchByUsernameHTTPEvent = new HTTPEvent({
  name: 'searchByUsername',
  manager: new SearchByUsernameHTTPEventManager(),
  // we set debounce as true and optionally pass a custom delay in ms
  debounce: true,
  debounceDelay: 500, // defaults to 300
});
```

Then, just trigger the Event as you would before and the Event will wait for that amount of time before dispatching itself:


```js
// on SearchByUsernameComponent.js
import { SearchByUsernameHTTPEvent } from './events.js';

class SearchByUsernameComponent extends React.Component {
  //...

  // even though the Event will be triggered whenever something is typed,
  // it will only be dispatched after the user stopped typing
  // and 500ms has passed since the last edit
  render() {
    return <inpyt type="text" onChange={e => this.props.searchByUsername({ username: e.target.value })} />
  };
  // ...
}

export default LoginHTTPEvent.register({ Component: LoginComponent });
```

The debounce function is provided straight from [lodash](https://lodash.com/docs/4.17.15#debounce).

### `useDataFrom` optional Event parameter

If you want, for example, to clear data from an Event, you'll notice there isn't a way inside the same Event to do so. Instead, you must create a new Event that writes data to the first Event's state.

```js
// on events.js
import { Event, HTTPEvent } from 'rel-events';
import { LoginHTTPEventManager, FetchUserDataHTTPEventManager } from './eventManagers.js';

export const LoginHTTPEvent = new HTTPEvent({
  name: 'login',
  manager: new LoginHTTPEventManager(),
});

export const ClearLoginDataEvent = new Event({
  name: 'clearLoginData',
  useDataFrom: 'login', // <-- we use the LoginHTTPEvent's name to link it's data to this new Event
  manager: {
    initialState: { isAuthenticated: false },
    onDispatch: () => initialState,
  }
});
```

You may use this optional param with HTTPEvents as well.

One thing to keep in mind: since this second Event uses the data from another, it can't be registered to a component passing a `props` key, since it doesn't have data of it's own. Don't worry, we'll warn if you if that happens. :)

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

Sometimes, all we want is to run some code after the new state from an event is set. For these cases, you may want to implement an `afterDispatch` method in your manager (for regular Events) or `afterSuccess`/`afterFailure` (for HTTPEvents).

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
