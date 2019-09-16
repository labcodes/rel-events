## Creating a HTTPEvent

The idea behind this library is to make data management easy and semantic, so we thought it would be best to include a special type of Event for making HTTP requests.

A `HTTPEvent` has the very same API as the basic `Event`, but instead of having a manager with only an `onDispatch` method, we'll need to implement 4 methods: `onDispatch`. `onSuccess`, `onFailure` and `call`.

```js
// on eventManagers.js
import { fetchFromApi } from 'rel-events';

export class LoginHTTPEventManager {
  initialState = { isLoading: false, username: 'Anonymous' };

  call = (user) => {
    return () => fetchFromApi(
      '/api/login',
      { method: 'POST', body: JSON.stringify(user) }
    );
  }

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

// on events.js
import { HTTPEvent } from 'rel-events';
import { LoginHTTPEventManager } from './eventManagers.js';

// notice we're using a HTTPEvent instead of a regular Event
export const LoginHTTPEvent = new HTTPEvent({
  name: 'login',
  manager: new LoginHTTPEventManager(),
});
```

Just a couple of notes about the `call` method:

Since this is a `HTTPEvent`, `call` needs to return a function, which will be called by our middleware to fetch the data. We use the middleware and fetch helper from [`react-redux-api-tools`](https://github.com/labcodes/react-redux-api-tools), so I'd suggest you at least take a look at their docs if you want to use `HTTPEvent`s. If, for example, you prefer to use `axios`, just remove `fetchFromApi` and replace it with your `axios` code.

**Disclaimer:** If you're going to use fetch, please use the `fetchFromApi` helper, or all `4xx` responses will trigger the `onSuccess` handler ([because fetch does not reject 4xx requests by default](https://www.tjvantoll.com/2015/09/13/fetch-and-errors/)).

And remember to hook up the event on redux and register your components!

```js
// on myAppRootReducers.js
import { combineReducers } from 'redux';
import { ChooseDateRangeEvent, LoginHTTPEvent } from './events.js';

export default combineReducers({
  ...ChooseDateRangeEvent.createReducers(),
  ...LoginHTTPEvent.createReducers(), // <<< new line here
});

// on LoginComponent.js
import { LoginHTTPEvent } from './events.js';

class LoginComponent extends React.Component {
  //...
  handleFormSubmit = ({ email, username }) => this.props.login({ email, username });
  // ...
}

export default LoginHTTPEvent.register({ Component: LoginComponent });
```

Now that we're done here, maybe you should take a look at some other goodies we have on the Advanced Usage section :)
