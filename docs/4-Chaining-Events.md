
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
    { event: () => LoginHTTPEvent, triggerOn: 'success' },
  ]
});
```

That means that, whenever the login is successful, `fetchUserData` will be triggered by calling `FetchUserDataHTTPEventManager.call` passing the data from the `LoginHTTPEvent.onSuccess` return.

**One caveat** is that the `event` value is **not** a direct reference to the Event that will be listened to. Instead, it's a function that returns the reference. That's needed because we could be using multiple files for multiple Events, and, if we do, we can't guarantee that `FetchUserDataHTTPEvent` will be loaded into memory before `LoginHTTPEvent`. If that happened, the `event` value would be `undefined`, so we chose to receive a function instead.

### Autocomplete Event calls using cached arguments when listening to another Event

There may be times when you may have an Event listening to multiple Events. Let's say, for example, that you want to get a client's profile whenever you search for their name, but you want to fetch it again if you change dates on a datepicker (or change the selected client, of course). You'll then have three Events: the datepicker one, the client search one and the client profile one, as follows:

```js
// on events.js
import { Event, HTTPEvent } from 'rel-events';
import {
  ChooseDateRangeEventManager,
  SearchByClientHTTPEventManager,
  GetClientProfileHTTPEventManager,
} from './eventManagers.js';

export const ChooseDateRangeEvent = new Event({
  name: 'chooseDateRange',
  manager: new ChooseDateRangeEventManager(),
});

export const SearchByClientHTTPEvent = new HTTPEvent({
  name: 'searchByClient',
  manager: new SearchByClientHTTPEventManager(),
});

export const GetClientProfileHTTPEvent = new HTTPEvent({
  name: 'getClientProfile',
  manager: new GetClientProfileHTTPEventManager(),
  listenTo: [
    { event: () => ChooseDateRangeEvent, triggerOn: 'dispatch' },
    { event: () => SearchByClientHTTPEvent, triggerOn: 'success' },
  ]
});
```

Since each Event has its own data (and we want to keep it that way), we now have a problem: since getting the client profile depends on both the daterange and the selected client on the search, whenever one of the Events triggers the other, it will never pass the whole data the other needs to call itself. You may be tempted to replicate data on multiple Events just for that case.

Instead, you may want an Event to be able to autocomplete new call arguments with the ones from the last call, so it will always have the full picture. That way, **whenever new dates are passed to the `GetClientProfileHTTPEvent`, it will remember which client was selected previously, and vice versa**. To enable that, just pass the `autocompleteCallArgs` as true when listening to an Event:

```js
// on events.js

// ...

export const GetClientProfileHTTPEvent = new HTTPEvent({
  name: 'getClientProfile',
  manager: new GetClientProfileHTTPEventManager(),
  listenTo: [
    { event: () => ChooseDateRangeEvent, triggerOn: 'dispatch', autocompleteCallArgs: true },
    { event: () => SearchByClientHTTPEvent, triggerOn: 'success', autocompleteCallArgs: true },
  ]
});
```

**NOTE:** We will probably favor this behavior as default on next major releases.
