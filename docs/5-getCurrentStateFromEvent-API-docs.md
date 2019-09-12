# `getCurrentStateFromEvent` API docs

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
