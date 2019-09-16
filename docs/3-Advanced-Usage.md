
## Advanced Usage: Other features and goodies

### Event Chaining - Making Events listen to Events

Sometimes, we want to make an Event be triggered by the completion of another. Let's imagine that, after logging in an user, we need to go somewhere to get the user's data.

Assuming you've implemented the `LoginHTTPEvent` as the example above, you'll need to implement your new Event and EventManager to fetch the user's data. After implementing, you just need to pass the `listenTo` key to your new event.

```js
// on events.js
import { HTTPEvent } from 'rel-events';
import { LoginHTTPEventManager, FetchUserDataHTTPEventManager } from './eventManagers.js';

export const LoginHTTPEvent = new HTTPEvent({
  name: 'login',
  manager: new LoginHTTPEventManager(),
});

// to chain an event to another, declare the `listenTo` key.
// and, yes, you may make an event listen to multiple events.
// be careful not to pass the direct reference to LoginHTTPEvent;
// pass a function that returns it instead.
export const FetchUserDataHTTPEvent = new HTTPEvent({
  name: 'fetchUserData',
  manager: new FetchUserDataHTTPEventManager(),
  listenTo: [
    { event: () => LoginHTTPEvent, trigger: 'onSuccess' },
  ]
});
```

That means that, whenever the login is successful, `fetchUserData` will be triggered by calling `FetchUserDataHTTPEventManager.call` passing the data from the `LoginHTTPEvent.onSuccess` return.

**One caveat** is that the `event` value is **not** a direct reference to the Event that will be listened to. Instead, it's a function that returns the reference. That's needed because we could be using multiple files for multiple Events, and, if we do, we can't guarantee that `FetchUserDataHTTPEvent` will be loaded into memory before `LoginHTTPEvent`. If that happened, the `event` value would be `undefined`, so we chose to receive a function instead.

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
