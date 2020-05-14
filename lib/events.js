import { connect } from 'react-redux';

const _debounce = require('lodash.debounce');

const isNumber = n => !window.isNaN(parseFloat(n)) && !window.isNaN(n - 0);

export class Event {
  constructor({
    name,
    manager,
    useDataFrom,
    debounce = false,
    debounceDelay = 300,
    listenTo = [],
  } = {}) {
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

    if (debounce && !isNumber(debounceDelay)) {
      throw new Error('When debounce is true, debounceDelay needs to be a Number.');
    }

    this.name = name;
    this.manager = manager;
    this.debounce = debounce;
    this.debounceDelay = debounceDelay;
    this.listenTo = listenTo;
    this.useDataFrom = useDataFrom;
    this.__UNSAFE_state = manager.initialState;
    this.reducerName = this._formatReducerName(this.name);

    if (this.debounce) {
      this._callRedux = _debounce(this._callRedux, this.debounceDelay);
    }
  }

  createReducers = () => {
    const reducers = {};

    if (this.useDataFrom) {
      reducers[this.useDataFrom] = this._createReducersTo();
    } else {
      reducers[this.name] = this._createReducersTo();
    }

    return reducers;
  };

  register = ({ Component, props = [] }) => {
    if (!Component) {
      throw new Error(
        'You must pass a Component inside the Component key when registering it to an Event.',
      );
    }

    return connect(this._bindDataToProps(props), this._bindDispatchToProps)(Component);
  };

  _createReducersTo = () => (state = this.manager.initialState, action) => {
    if (action.type === this.reducerName) {
      const newState = this.manager.onDispatch(state, action);

      if (this.manager.afterDispatch) {
        setTimeout(() => this.manager.afterDispatch(state, newState), 0);
      }

      this.__UNSAFE_state = newState;
      this._chainEvents(action);

      return newState;
    }
    this._chainEvents(action);
    return state;
  };

  _chainEvents = action => {
    const { listenTo, _formatToRedux, __UNSAFE_cachedArgs: cachedArgs } = this;

    if (listenTo.length) {
      listenTo.map(({ event, triggerOn, autocompleteCallArgs }) => {
        event = event();
        const reducer = event.reducerName ? event.reducerName : event.reducers[triggerOn];

        if (action.type === reducer) {
          setTimeout(() => {
            const dispatchData = autocompleteCallArgs
              ? { ...cachedArgs, ...event.__UNSAFE_state }
              : event.__UNSAFE_state;

            action.__UNSAFE_dispatch(_formatToRedux(dispatchData));
          });
        }
      });
    }
  };

  _callRedux = dispatchData => this.__UNSAFE_reduxDispatch(this._formatToRedux(dispatchData));

  _formatToRedux = dispatchData => {
    this.__UNSAFE_cachedArgs = dispatchData;
    return {
      type: this.reducerName,
      shouldDispatch: this.manager.shouldDispatch || (() => true),
      extraData: dispatchData,
      ...dispatchData,
    };
  };

  _bindDataToProps = props => {
    if (this.useDataFrom && props.length) {
      throw new Error(
        `When configuring 'useDataFrom', you will end up with an empty state. Listen to the event with the name described in the 'useDataFrom' key instead.`,
      );
    }
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
    this.__UNSAFE_reduxDispatch = reduxDispatch;
    const actions = {};
    actions[this.name] = this._callRedux;
    return actions;
  };

  _formatReducerName = name =>
    name
      .replace(/\.?([A-Z])/g, (_x, y) => `_${y.toLowerCase()}`)
      .replace(/^_/, '')
      .toUpperCase();
}

export class HTTPEvent extends Event {
  constructor({ name, ...rest } = {}) {
    super({ name, ...rest });

    delete this.reducerName;

    this.reducers = {
      request: `${this._formatReducerName(this.name)}_REQUEST`,
      success: `${this._formatReducerName(this.name)}_SUCCESS`,
      failure: `${this._formatReducerName(this.name)}_FAILURE`,
    };
  }

  _formatToRedux = dispatchData => {
    this.__UNSAFE_cachedArgs = dispatchData;
    const { shouldDispatch } = this.manager;
    return {
      types: this.reducers,
      extraData: dispatchData,
      apiCallFunction: this.manager.call(dispatchData),
      shouldDispatch: shouldDispatch || (() => true),
    };
  };

  _createReducersTo = () => (state = this.manager.initialState, action) => {
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
}
