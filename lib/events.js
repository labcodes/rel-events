import { connect } from 'react-redux';

export class Event {
  constructor({ name, manager }) {
    if (!name) {
      throw new Error('An Event should be initialized with an event name.');
    }

    if (!manager) {
      throw new Error('An Event should be initialized with an EventManager.');
    }

    this.name = name;
    this.manager = manager;
    this.reducerName = this._formatReducerName(this.name);
  }

  toRedux = data => ({
    type: this.reducerName,
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

        return newState;
      }
      return state;
    };

    return reducers;
  };

  register = ({ Component, listenTo = [] }) =>{
    if (!Component) {
      throw new Error('You must pass a Component inside the Component key when registering it to an event.')
    }

    return connect(
      this._bindDataToProps(listenTo),
      this._bindDispatchToProps,
    )(Component);
  }

  _dispatch = reduxDispatch => dispatchData => reduxDispatch(this.toRedux(dispatchData));

  _bindDataToProps = listenTo => {
    const { name } = this;

    return state => {
      const data = {};
      data[`_event_${name}`] = this;

      listenTo.map(key => {
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

export class RequestEvent extends Event {
  constructor({ name, manager }) {
    super({ name, manager });

    delete this.reducerName;

    this.reducers = {
      request: `${this._formatReducerName(this.name)}_REQUEST`,
      success: `${this._formatReducerName(this.name)}_SUCCESS`,
      failure: `${this._formatReducerName(this.name)}_FAILURE`,
    };
  }

  toRedux = dispatchData => {
    const { shouldCallApi } = this.manager;
    return {
      types: this.reducers,
      extraData: dispatchData,
      apiCallFunction: this.manager.call(dispatchData),
      shouldCallApi: shouldCallApi || (() => true),
    };
  };

  createReducers = () => {
    const reducers = {};

    reducers[this.name] = (state = this.manager.initialState, action) => {
      let newState;

      switch (action.type) {
        case this.reducers.request:
          return this.manager.onRequest(state, action);

        case this.reducers.success:
          newState = this.manager.onSuccess(state, action);
          if (this.manager.afterSuccess) {
            setTimeout(() => this.manager.afterSuccess(state, newState), 0);
          }
          return newState;

        case this.reducers.failure:
          newState = this.manager.onFailure(state, action);
          if (this.manager.afterFailure) {
            setTimeout(() => this.manager.afterFailure(state, newState), 0);
          }
          return newState;

        default:
          return state;
      }
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
