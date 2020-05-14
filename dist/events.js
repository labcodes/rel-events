"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HTTPEvent = exports.Event = void 0;

var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _reactRedux = require("react-redux");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function () { var Super = (0, _getPrototypeOf2.default)(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2.default)(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2.default)(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var _debounce = require('lodash.debounce');

var isNumber = function isNumber(n) {
  return !window.isNaN(parseFloat(n)) && !window.isNaN(n - 0);
};

var Event = function Event() {
  var _this = this;

  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _name = _ref.name,
      manager = _ref.manager,
      useDataFrom = _ref.useDataFrom,
      _ref$debounce = _ref.debounce,
      debounce = _ref$debounce === void 0 ? false : _ref$debounce,
      _ref$debounceDelay = _ref.debounceDelay,
      debounceDelay = _ref$debounceDelay === void 0 ? 300 : _ref$debounceDelay,
      _ref$listenTo = _ref.listenTo,
      _listenTo = _ref$listenTo === void 0 ? [] : _ref$listenTo;

  (0, _classCallCheck2.default)(this, Event);

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

      _this._chainEvents(action);

      return state;
    };
  };

  this._chainEvents = function (action) {
    var listenTo = _this.listenTo,
        _formatToRedux = _this._formatToRedux,
        cachedArgs = _this.__UNSAFE_cachedArgs;

    if (listenTo.length) {
      listenTo.map(function (_ref3) {
        var event = _ref3.event,
            triggerOn = _ref3.triggerOn,
            autocompleteCallArgs = _ref3.autocompleteCallArgs;
        event = event();
        var reducer = event.reducerName ? event.reducerName : event.reducers[triggerOn];

        if (action.type === reducer) {
          setTimeout(function () {
            var dispatchData = autocompleteCallArgs ? _objectSpread(_objectSpread({}, cachedArgs), event.__UNSAFE_state) : event.__UNSAFE_state;

            action.__UNSAFE_dispatch(_formatToRedux(dispatchData));
          });
        }
      });
    }
  };

  this._callRedux = function (dispatchData) {
    return _this.__UNSAFE_reduxDispatch(_this._formatToRedux(dispatchData));
  };

  this._formatToRedux = function (dispatchData) {
    _this.__UNSAFE_cachedArgs = dispatchData;
    return _objectSpread({
      type: _this.reducerName,
      shouldDispatch: _this.manager.shouldDispatch || function () {
        return true;
      },
      extraData: dispatchData
    }, dispatchData);
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
    _this.__UNSAFE_reduxDispatch = reduxDispatch;
    var actions = {};
    actions[_this.name] = _this._callRedux;
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

  if (debounce && !isNumber(debounceDelay)) {
    throw new Error('When debounce is true, debounceDelay needs to be a Number.');
  }

  this.name = _name;
  this.manager = manager;
  this.debounce = debounce;
  this.debounceDelay = debounceDelay;
  this.listenTo = _listenTo;
  this.useDataFrom = useDataFrom;
  this.__UNSAFE_state = manager.initialState;
  this.reducerName = this._formatReducerName(this.name);

  if (this.debounce) {
    this._callRedux = _debounce(this._callRedux, this.debounceDelay);
  }
};

exports.Event = Event;

var HTTPEvent = /*#__PURE__*/function (_Event) {
  (0, _inherits2.default)(HTTPEvent, _Event);

  var _super = _createSuper(HTTPEvent);

  function HTTPEvent() {
    var _this2;

    var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        name = _ref4.name,
        rest = (0, _objectWithoutProperties2.default)(_ref4, ["name"]);

    (0, _classCallCheck2.default)(this, HTTPEvent);
    _this2 = _super.call(this, _objectSpread({
      name: name
    }, rest));

    _this2._formatToRedux = function (dispatchData) {
      _this2.__UNSAFE_cachedArgs = dispatchData;
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