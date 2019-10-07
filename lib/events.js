import { connect } from 'react-redux';

export class Event {
  constructor({ name, manager, listenTo = [] } = {}) {
    if (arguments.length === 0) {
      throw new Error('An Event should not be initialized without parameters.');
    } else {
      if (!name) {
        throw new Error('An Event should be initialized with an event name.');
      }

      if (!manager) {
        throw new Error('An Event should be initialized with an EventManager.');
      }

      if (
        !Array.isArray(listenTo) ||
        !listenTo.every(
          obj =>
            obj.hasOwnProperty('event') &&
            obj.hasOwnProperty('triggerOn') &&
            typeof obj.event === 'function',
        )
      ) {
        throw new Error(
          'ListenTo must be an array of { event, triggerOn } objects, and the event key should be a function that returns an Event or HTTPEvent.',
        );
      }
    }
    this.name = name;
    this.manager = manager;
    this.listenTo = listenTo;
    this.__UNSAFE_state = manager.initialState;
    this.reducerName = this._formatReducerName(this.name);
  }

  toRedux = data => ({
    type: this.reducerName,
    shouldDispatch: this.manager.shouldDispatch || (() => true),
    ...data,
  });

  createReducers = () => {
    const reducers = {};

    reducers[this.name] = (state = this.manager.initialState, action) => {
      if (action.type === this.reducerName) {
        const newState = this.manager.onDispatch(state, action);

        if (this.manager.afterDispatch) {
          setTimeout(() => this.manager.afterDispatch(state, newState), 0);
        }

        this.__UNSAFE_state = newState;
        this._chainEvents(action);

        return newState;
      }
      return state;
    };

    return reducers;
  };

  register = ({ Component, props = [] }) => {
    if (!Component) {
      throw new Error(
        'You must pass a Component inside the Component key when registering it to an Event.',
      );
    }

    return connect(
      this._bindDataToProps(props),
      this._bindDispatchToProps,
    )(Component);
  };

  _chainEvents = action => {
    const { listenTo, toRedux } = this;

    if (listenTo.length) {
      listenTo.map(({ event, triggerOn }) => {
        event = event();
        const reducer = event.reducerName ? event.reducerName : event.reducers[triggerOn];

        if (action.type === reducer) {
          setTimeout(() => action.__UNSAFE_dispatch(toRedux(event.__UNSAFE_state)));
        }
      });
    }
  };

  _dispatch = reduxDispatch => dispatchData => reduxDispatch(this.toRedux(dispatchData));

  _bindDataToProps = props => {
    const { name } = this;

    return state => {
      const data = {};
      data[`_event_${name}`] = this;

      props.map(key => {
        data[key] = state[name][key];
        return null;
      });

      return data;
    };
  };

  _bindDispatchToProps = reduxDispatch => {
    const actions = {};
    actions[this.name] = this._dispatch(reduxDispatch);
    return actions;
  };

  _formatReducerName = name =>
    name
      .replace(/\.?([A-Z])/g, (_x, y) => `_${y.toLowerCase()}`)
      .replace(/^_/, '')
      .toUpperCase();
}

export class HTTPEvent extends Event {
  constructor({ name, manager, listenTo = [] } = {}) {
    super({ name, manager, listenTo });

    delete this.reducerName;

    this.reducers = {
      request: `${this._formatReducerName(this.name)}_REQUEST`,
      success: `${this._formatReducerName(this.name)}_SUCCESS`,
      failure: `${this._formatReducerName(this.name)}_FAILURE`,
    };
  }

  toRedux = dispatchData => {
    const { shouldDispatch } = this.manager;
    return {
      types: this.reducers,
      extraData: dispatchData,
      apiCallFunction: this.manager.call(dispatchData),
      shouldDispatch: shouldDispatch || (() => true),
    };
  };

  createReducers = () => {
    const reducers = {};

    reducers[this.name] = (state = this.manager.initialState, action) => {
      let newState = state;

      if (action.type === this.reducers.request) {
        newState = this.manager.onDispatch(state, action);
      }

      if (action.type === this.reducers.success) {
        newState = this.manager.onSuccess(state, action);
        if (this.manager.afterSuccess) {
          setTimeout(() => this.manager.afterSuccess(state, newState), 0);
        }
      }

      if (action.type === this.reducers.failure) {
        newState = this.manager.onFailure(state, action);
        if (this.manager.afterFailure) {
          setTimeout(() => this.manager.afterFailure(state, newState), 0);
        }
      }

      this.__UNSAFE_state = newState;
      this._chainEvents(action);

      return newState;
    };

    return reducers;
  };
}

export function dispatchEvent({ event, store, data }) {
  if (!event) {
    throw new Error('You need to pass an event.');
  } else if (typeof event.toRedux !== 'function') {
    throw new Error(
      'The event you passed needs to have a `toRedux` method. Are you sure you instantiated and passed the correct event?',
    );
  }

  if (!store) {
    throw new Error('You need to pass your redux store.');
  } else if (typeof store.dispatch !== 'function') {
    throw new Error(
      'The store you passed does not have a `dispatch` method. Are you sure you passed the correct variable as the store?',
    );
  }

  return store.dispatch(event.toRedux(data));
}

export function getCurrentStateFromEvent({ appState, event }) {
  if (!event) {
    throw new Error('You need to pass an event.');
  }

  if (!appState) {
    throw new Error(
      'You need to pass your app state. This is only available inside `shouldDispatch` methods or imported manually (not recommended).',
    );
  }

  return appState[event.name];
}
