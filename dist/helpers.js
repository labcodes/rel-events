"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._combineConflictingReducers = _combineConflictingReducers;
exports.combineEventReducers = combineEventReducers;
exports.dispatchEvent = dispatchEvent;
exports.getCurrentStateFromEvent = getCurrentStateFromEvent;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

function _combineConflictingReducers() {
  var reducers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  // needed for compatibility
  var reducersArray = reducers.map(function (reducer) {
    return Object.values(reducer)[0];
  });
  return function (state, action) {
    for (var i = 0; i < reducersArray.length; i++) {
      var reducer = reducersArray[i];
      state = reducer(state, action);
    }

    return state;
  };
}

function combineEventReducers() {
  var events = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var conflictingEventsAndKeys = {};
  var combinedReducers = {};
  events.forEach(function (event) {
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
  Object.keys(conflictingEventsAndKeys).forEach(function (eventName) {
    var baseEvent = events.filter(function (event) {
      return event.name === eventName;
    });

    if (!baseEvent.length) {
      throw new Error("Event with ".concat(eventName, " name not found."));
    } // eslint-disable-next-line prefer-destructuring


    baseEvent = baseEvent[0];
    combinedReducers[eventName] = _combineConflictingReducers([baseEvent.createReducers()].concat((0, _toConsumableArray2.default)(conflictingEventsAndKeys[eventName].map(function (event) {
      return event.createReducers();
    }))));
  });
  return combinedReducers;
}

function dispatchEvent(_ref) {
  var event = _ref.event,
      store = _ref.store,
      data = _ref.data;

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

function getCurrentStateFromEvent(_ref2) {
  var appState = _ref2.appState,
      event = _ref2.event;

  if (!event) {
    throw new Error('You need to pass an event.');
  }

  if (!appState) {
    throw new Error('You need to pass your app state. This is only available inside `shouldDispatch` methods or imported manually (not recommended).');
  }

  return appState[event.name];
}