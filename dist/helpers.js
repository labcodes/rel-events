"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatchEvent = dispatchEvent;
exports.getCurrentStateFromEvent = getCurrentStateFromEvent;

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