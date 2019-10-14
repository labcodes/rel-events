"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._combineConflictingReducers = _combineConflictingReducers;
exports.combineEventReducers = combineEventReducers;
exports.dispatchEvent = dispatchEvent;
exports.getCurrentStateFromEvent = getCurrentStateFromEvent;

function _combineConflictingReducers(reducers = []) {
  // needed for compatibility
  const reducersArray = reducers.map(reducer => Object.values(reducer)[0]);
  return (state, action) => {
    for (let i = 0; i < reducersArray.length; i++) {
      const reducer = reducersArray[i];
      state = reducer(state, action);
    }

    return state;
  };
}

function combineEventReducers(events = []) {
  const conflictingEventsAndKeys = {};
  const combinedReducers = {};
  events.forEach(event => {
    if (event.useDataFrom) {
      if (!conflictingEventsAndKeys[event.useDataFrom]) {
        conflictingEventsAndKeys[event.useDataFrom] = [];
      }

      conflictingEventsAndKeys[event.useDataFrom].push(event);
    } else {
      // eslint-disable-next-line prefer-destructuring
      combinedReducers[event.name] = Object.values(event.createReducers())[0];
    }
  });
  Object.keys(conflictingEventsAndKeys).forEach(eventName => {
    let baseEvent = events.filter(event => event.name === eventName);

    if (!baseEvent.length) {
      throw new Error(`Event with ${eventName} name not found.`);
    } // eslint-disable-next-line prefer-destructuring


    baseEvent = baseEvent[0];
    combinedReducers[eventName] = _combineConflictingReducers([baseEvent.createReducers(), ...conflictingEventsAndKeys[eventName].map(event => event.createReducers())]);
  });
  return combinedReducers;
}

function dispatchEvent({
  event,
  store,
  data
}) {
  if (!event) {
    throw new Error('You need to pass an event.');
  } else if (typeof event.toRedux !== 'function') {
    throw new Error('The event you passed needs to have a `toRedux` method. Are you sure you instantiated and passed the correct event?');
  }

  if (!store) {
    throw new Error('You need to pass your redux store.');
  } else if (typeof store.dispatch !== 'function') {
    throw new Error('The store you passed does not have a `dispatch` method. Are you sure you passed the correct variable as the store?');
  }

  return store.dispatch(event.toRedux(data));
}

function getCurrentStateFromEvent({
  appState,
  event
}) {
  if (!event) {
    throw new Error('You need to pass an event.');
  }

  if (!appState) {
    throw new Error('You need to pass your app state. This is only available inside `shouldDispatch` methods or imported manually (not recommended).');
  }

  return appState[event.name];
}