"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HTTPEvent = exports.Event = void 0;

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _reactRedux = require("react-redux");

var Event = function Event() {
  var _this = this;

  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _name = _ref.name,
      manager = _ref.manager,
      useDataFrom = _ref.useDataFrom,
      _ref$listenTo = _ref.listenTo,
      _listenTo = _ref$listenTo === void 0 ? [] : _ref$listenTo;

  (0, _classCallCheck2.default)(this, Event);

  this.toRedux = function (dispatchData) {
    return {
      type: _this.reducerName,
      shouldDispatch: _this.manager.shouldDispatch || function () {
        return true;
      },
      extraData: dispatchData
    };
  };

  this.createReducers = function () {
    var reducers = {};

    if (_this.useDataFrom) {
      reducers[_this.useDataFrom] = _this._createReducersTo();
    } else {
      reducers[_this.name] = _this._createReducersTo();
    }

    return reducers;
  };

  this.register = function (_ref2) {
    var Component = _ref2.Component,
        _ref2$props = _ref2.props,
        props = _ref2$props === void 0 ? [] : _ref2$props;

    if (!Component) {
      throw new Error('You must pass a Component inside the Component key when registering it to an Event.');
    }

    return (0, _reactRedux.connect)(_this._bindDataToProps(props), _this._bindDispatchToProps)(Component);
  };

  this._createReducersTo = function () {
    return function () {
      var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this.manager.initialState;
      var action = arguments.length > 1 ? arguments[1] : undefined;

      if (action.type === _this.reducerName) {
        var newState = _this.manager.onDispatch(state, action);

        if (_this.manager.afterDispatch) {
          setTimeout(function () {
            return _this.manager.afterDispatch(state, newState);
          }, 0);
        }

        _this.__UNSAFE_state = newState;

        _this._chainEvents(action);

        return newState;
      }

      return state;
    };
  };

  this._chainEvents = function (action) {
    var listenTo = _this.listenTo,
        toRedux = _this.toRedux;

    if (listenTo.length) {
      listenTo.map(function (_ref3) {
        var event = _ref3.event,
            triggerOn = _ref3.triggerOn;
        event = event();
        var reducer = event.reducerName ? event.reducerName : event.reducers[triggerOn];

        if (action.type === reducer) {
          setTimeout(function () {
            return action.__UNSAFE_dispatch(toRedux(event.__UNSAFE_state));
          });
        }
      });
    }
  };

  this._dispatch = function (reduxDispatch) {
    return function (dispatchData) {
      return reduxDispatch(_this.toRedux(dispatchData));
    };
  };

  this._bindDataToProps = function (props) {
    if (_this.useDataFrom && props.length) {
      throw new Error("When configuring 'useDataFrom', you will end up with an empty state. Listen to the event with the name described in the 'useDataFrom' key instead.");
    }

    var name = _this.name;
    return function (state) {
      var data = {};
      data["_event_".concat(name)] = _this;
      props.map(function (key) {
        data[key] = state[name][key];
        return null;
      });
      return data;
    };
  };

  this._bindDispatchToProps = function (reduxDispatch) {
    var actions = {};
    actions[_this.name] = _this._dispatch(reduxDispatch);
    return actions;
  };

  this._formatReducerName = function (name) {
    return name.replace(/\.?([A-Z])/g, function (_x, y) {
      return "_".concat(y.toLowerCase());
    }).replace(/^_/, '').toUpperCase();
  };

  if (arguments.length === 0) {
    throw new Error('An Event should not be initialized without parameters.');
  } else {
    if (!_name) {
      throw new Error('An Event should be initialized with an event name.');
    }

    if (!manager) {
      throw new Error('An Event should be initialized with an EventManager.');
    }

    if (!Array.isArray(_listenTo) || !_listenTo.every(function (obj) {
      return obj.hasOwnProperty('event') && obj.hasOwnProperty('triggerOn') && typeof obj.event === 'function';
    })) {
      throw new Error('ListenTo must be an array of { event, triggerOn } objects, and the event key should be a function that returns an Event or HTTPEvent.');
    }
  }

  this.name = _name;
  this.manager = manager;
  this.listenTo = _listenTo;
  this.useDataFrom = useDataFrom;
  this.__UNSAFE_state = manager.initialState;
  this.reducerName = this._formatReducerName(this.name);
};

exports.Event = Event;

var HTTPEvent =
/*#__PURE__*/
function (_Event) {
  (0, _inherits2.default)(HTTPEvent, _Event);

  function HTTPEvent() {
    var _this2;

    var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        name = _ref4.name,
        manager = _ref4.manager,
        useDataFrom = _ref4.useDataFrom,
        _ref4$listenTo = _ref4.listenTo,
        listenTo = _ref4$listenTo === void 0 ? [] : _ref4$listenTo;

    (0, _classCallCheck2.default)(this, HTTPEvent);
    _this2 = (0, _possibleConstructorReturn2.default)(this, (0, _getPrototypeOf2.default)(HTTPEvent).call(this, {
      name: name,
      manager: manager,
      useDataFrom: useDataFrom,
      listenTo: listenTo
    }));

    _this2.toRedux = function (dispatchData) {
      var shouldDispatch = _this2.manager.shouldDispatch;
      return {
        types: _this2.reducers,
        extraData: dispatchData,
        apiCallFunction: _this2.manager.call(dispatchData),
        shouldDispatch: shouldDispatch || function () {
          return true;
        }
      };
    };

    _this2._createReducersTo = function () {
      return function () {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this2.manager.initialState;
        var action = arguments.length > 1 ? arguments[1] : undefined;
        var newState = state;

        if (action.type === _this2.reducers.request) {
          newState = _this2.manager.onDispatch(state, action);
        }

        if (action.type === _this2.reducers.success) {
          newState = _this2.manager.onSuccess(state, action);

          if (_this2.manager.afterSuccess) {
            setTimeout(function () {
              return _this2.manager.afterSuccess(state, newState);
            }, 0);
          }
        }

        if (action.type === _this2.reducers.failure) {
          newState = _this2.manager.onFailure(state, action);

          if (_this2.manager.afterFailure) {
            setTimeout(function () {
              return _this2.manager.afterFailure(state, newState);
            }, 0);
          }
        }

        _this2.__UNSAFE_state = newState;

        _this2._chainEvents(action);

        return newState;
      };
    };

    delete _this2.reducerName;
    _this2.reducers = {
      request: "".concat(_this2._formatReducerName(_this2.name), "_REQUEST"),
      success: "".concat(_this2._formatReducerName(_this2.name), "_SUCCESS"),
      failure: "".concat(_this2._formatReducerName(_this2.name), "_FAILURE")
    };
    return _this2;
  }

  return HTTPEvent;
}(Event);

exports.HTTPEvent = HTTPEvent;