# rel-events

[![Build Status](https://travis-ci.org/labcodes/rel-events.svg?branch=master)](https://travis-ci.org/labcodes/rel-events) [![Coverage Status](https://coveralls.io/repos/github/labcodes/rel-events/badge.svg?branch=master)](https://coveralls.io/github/labcodes/rel-events?branch=master)

*To read the docs, [go to our docs folder](https://github.com/labcodes/rel-events/tree/master/docs). :)*

Welcome to the `rel-events` github repo!

`rel-events` is an awesome events library for react. It uses `redux` behind the scenes to offer a more convenient, simple and relevant API for dealing with data flows.

# Basic Usage

### Installing

To install `rel-events`, just run `npm i --save rel-events`.

If you wish to use Events to make HTTP Requests (which you probably do), there's another step to set things up. Follow our [HTTPEvents Guide](https://github.com/labcodes/rel-events/tree/master/docs/2-HTTP-Events.md) to have everything ready. :)

With that done, you may start to create some events!

### Creating a basic Event

Let's say you want to pass a range of dates from `DatePickerComponent` to `CalendarComponent`. Instead of creating actions and reducers, forget everything about redux; create an Event instead.

To do that, you need to initialize a new Event. It's recommended you create it in a new file (`events.js`).

```js
// on events.js
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

First, you import the Event class from our lib, then instantiate a new event. This Event receives an object with two required keys: `name` and `manager`. While `name` is self-explanatory, `manager` is not.

For default Events, an Event Manager should have an `initialState` and implement an `onDispatch` method, which will be called whenever the event is dispatched. This is the alternative to the reducer part of the default redux flow.

We recommend using classes for your EventManagers as well, since we can decouple Events from their managers.

```js
// on eventManagers.js
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
// on events.js
import { Event } from 'rel-events';
import { ChooseDateRangeEventManager } from './eventManagers.js';

export const ChooseDateRangeEvent = new Event({
  name: 'chooseDateRange',
  manager: new ChooseDateRangeEventManager(),
);
```

### Hooking it up with redux

With the event instantiated, you need to hook it up to redux so it can be dispatched and save data. When creating your root reducer, you should import the Event and initialize its reducers.

```js
// on myAppRootReducers.js
import { combineReducers } from 'redux';
import { ChooseDateRangeEvent } from './events.js';

// remember to use object spread, so it's set up correctly
export default combineReducers({
  ...ChooseDateRangeEvent.createReducers(),
});
```

Notice the store names and reducers aren't declared anymore; you don't need to. Any Event object will deal with anything and everything redux related. To be able to do that, you only need to hook it to redux as the example above. To see more on how this works, read our [how it works docs](https://github.com/labcodes/rel-events/tree/master/docs/7-How-it-works.md).

Now you have our Event ready to go! Now, you just need to register it to a Component, which can trigger it and/or listen to it.

### Registering components to Events

Let's say you have a component called `DatePickerComponent` that knows how to render a beautiful date picker. It has a `handleDatesChange` method to update the state with the new dates.

```jsx
export default class DatePickerComponent extends React.Component {
  //...
  handleDatesChange = (startDate, endDate) => {
    this.setState({ startDate, endDate });
  }
  //...
}
```

To be able to send data from this component to the `CalendarComponent`, you may register both Components to your Event. Whenever you register a Component to an Event, you automatically receive a function to trigger the event as a prop. The function's name is the same as the event name you passed when initializing the event.

```jsx
import { ChooseDateRangeEvent } from './events.js';

// you won't export the component directly anymore
class DatePickerComponent extends React.Component {
  //...
  handleDatesChange = (startDate, endDate) => {
    // here, the event passing the new dates is triggered
    // after setState is done
    this.setState(
      { startDate, endDate },
      () => this.props.chooseDateRange({ startDate, endDate })
    );
  }
  //...
}

// and here, you register the component to the event.
// since Components are mostly named with CamelCase,
// we preferred to name the key like that as well
export default ChooseDateRangeEvent.register({
  Component: DatePickerComponent,
});

// you may as well register a Component to multiple events, no worries;
// just remember to only export after you're done registering the Component to your events
```

Then, you may register your `CalendarComponent` as well, but passing a new `props` key:

```jsx
import { ChooseDateRangeEvent } from './events.js';

class CalendarComponent extends React.Component {
  //...
  render(){
    const { startDate, endDate } = this.props;

    return <h1>The dates are: {startDate}, {endDate}</h1>
  }
}

// and here, you get the props from the event
export default ChooseDateRangeEvent.register({
  Component: CalendarComponent,
  props: ['startDate', 'endDate'],
})
```

And that's it! We still have a lot of other features to discuss, but I'll talk about those later. Before that, let's talk about [using events to make HTTP requests](https://github.com/labcodes/rel-events/tree/master/docs/2-HTTP-Events.md).

### Contributing

Don't hesitate to open an issue for bugs!

But if you would like a new feature, it would be nice to discuss it before accepting PRs. We reserve ourselves the right to reject a feature that was not discussed or that will impact the code or API in a meaningful way. In that case, open an issue so we can discuss it thoroughly. Thanks. <3

### Thanks

Thanks for everyone at Labcodes for giving me the structure and time for me to work on this pet project of mine and giving me lots of awesome feedback! Bernardo Fontes, Luan Fonseca, Thulio Philipe, Mariana Bedran, Breno Chamie and Renato Oliveira, I'm really, really grateful for your input! <3
