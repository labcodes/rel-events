import * as redux from 'react-redux';

import { Event, RequestEvent, dispatchEvent, getCurrentStateFromEvent } from '../lib/events';

describe('Event', () => {
  it('should initialize correctly', async () => {
    let TestEvent = new Event({
      name: 'testEvent',
      manager: { initialState: { initial: 'state' } },
    });
    expect(TestEvent.name).toEqual('testEvent');
    expect(TestEvent.manager).toEqual({ initialState: { initial: 'state' } });
    expect(TestEvent.__UNSAFE_state).toEqual({ initial: 'state' });
    expect(TestEvent.reducerName).toEqual('TEST_EVENT');
    expect(TestEvent.listenTo).toEqual([]);

    const mockEvent = jest.fn(() => 'event');
    const listenTo = [{ event: mockEvent, trigger: 'onDispatch' }];
    TestEvent = new Event({
      name: 'testEvent',
      manager: { initialState: { initial: 'state' } },
      listenTo,
    });
    expect(TestEvent.name).toEqual('testEvent');
    expect(TestEvent.manager).toEqual({ initialState: { initial: 'state' } });
    expect(TestEvent.__UNSAFE_state).toEqual({ initial: 'state' });
    expect(TestEvent.reducerName).toEqual('TEST_EVENT');
    expect(TestEvent.listenTo).toEqual(listenTo);
  });

  it('should throw error when initializing without name', async () => {
    expect(() => new Event({})).toThrow('An Event should be initialized with an event name.');
  });

  it('should throw error when initializing without manager', async () => {
    expect(() => new Event({ name: 'testEvent' })).toThrow(
      'An Event should be initialized with an EventManager.',
    );
  });

  it('should throw error when initializing with invalid listenTo param', async () => {
    expect(() => new Event({ name: 'testEvent', manager: {}, listenTo: {} })).toThrow(
      'ListenTo must be an array of { event, trigger } objects, and the event key sould be a function that returns an Event of RequestEvent.',
    );
    expect(() => new Event({ name: 'testEvent', manager: {}, listenTo: [{}] })).toThrow(
      'ListenTo must be an array of { event, trigger } objects, and the event key sould be a function that returns an Event of RequestEvent.',
    );
    expect(() => new Event({ name: 'testEvent', manager: {}, listenTo: [{ event: '' }] })).toThrow(
      'ListenTo must be an array of { event, trigger } objects, and the event key sould be a function that returns an Event of RequestEvent.',
    );
    expect(
      () => new Event({ name: 'testEvent', manager: {}, listenTo: [{ event: () => ({}) }] }),
    ).toThrow(
      'ListenTo must be an array of { event, trigger } objects, and the event key sould be a function that returns an Event of RequestEvent.',
    );
    expect(
      () => new Event({ name: 'testEvent', manager: {}, listenTo: [{ trigger: '' }] }),
    ).toThrow(
      'ListenTo must be an array of { event, trigger } objects, and the event key sould be a function that returns an Event of RequestEvent.',
    );
    expect(
      () =>
        new Event({
          name: 'testEvent',
          manager: {},
          listenTo: [{ event: () => ({}), trigger: 'onDispatch' }],
        }),
    ).not.toThrow();
  });

  it('_dispatch should call toRedux passing data using redux dispatch', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    TestEvent.toRedux = jest.fn();
    const data = { test: 'data' };
    const reduxDispatch = jest.fn();

    TestEvent._dispatch(reduxDispatch)(data);

    expect(reduxDispatch).toBeCalled();
    expect(TestEvent.toRedux).toBeCalledWith({ ...data, shouldDispatch: expect.Function });
  });

  it('_bindDataToProps should map state and set event on it', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    const keysList = ['test', 'yep'];
    const state = { testEvent: {} };

    const _bindDataToProps = TestEvent._bindDataToProps(keysList);
    const mappedState = _bindDataToProps(state);

    expect(typeof _bindDataToProps).toBe('function');
    expect(mappedState._event_testEvent).toBe(TestEvent);
    expect(mappedState).toHaveProperty('test');
    expect(mappedState).toHaveProperty('yep');
  });

  it('_bindDispatchToProps should map actions and pass redux dispatch', async () => {
    const reduxDispatch = jest.fn();
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    TestEvent._dispatch = jest.fn(() => 'dispatched');

    const _bindDispatchToProps = TestEvent._bindDispatchToProps(reduxDispatch);

    expect(TestEvent._dispatch).toHaveBeenCalledWith(reduxDispatch);
    expect(_bindDispatchToProps.testEvent).toEqual('dispatched');
  });

  it('toRedux should return correct data', async () => {
    let TestEvent = new Event({ name: 'testEvent', manager: {} });
    let expectedReturn = {
      type: 'TEST_EVENT',
      test: 'yes',
      shouldDispatch: expect.any(Function),
    };

    let returnedValue = TestEvent.toRedux({ test: 'yes' });
    expect(returnedValue).toEqual(expectedReturn);
    expect(returnedValue.shouldDispatch()).toEqual(true);

    const shouldDispatch = () => 'lala';
    TestEvent = new Event({ name: 'testEvent', manager: { shouldDispatch } });
    expectedReturn = {
      type: 'TEST_EVENT',
      test: 'yes',
      shouldDispatch,
    };

    returnedValue = TestEvent.toRedux({ test: 'yes' });
    expect(returnedValue).toEqual(expectedReturn);
    expect(returnedValue.shouldDispatch()).toEqual('lala');
  });

  it('createReducers should return object containing reducers', async () => {
    const EventManager = {
      onDispatch: jest.fn(() => ({ test: 'it works!' })),
      initialState: { initial: 'state' },
    };
    const TestEvent = new Event({ name: 'testEvent', manager: EventManager });
    TestEvent._chainEvents = jest.fn();
    const reducers = TestEvent.createReducers();

    expect(reducers).toHaveProperty('testEvent');
    expect(typeof reducers.testEvent).toBe('function');

    expect(reducers.testEvent(undefined, { type: 'notThisOne' })).toEqual(
      EventManager.initialState,
    );
    expect(EventManager.onDispatch).not.toBeCalled();

    expect(TestEvent._chainEvents).not.toBeCalled();
    expect(reducers.testEvent({}, { type: 'TEST_EVENT' })).toEqual({ test: 'it works!' });
    expect(EventManager.onDispatch).toBeCalled();
    expect(TestEvent._chainEvents).toBeCalledWith({ type: 'TEST_EVENT' });
    expect(TestEvent.__UNSAFE_state).toEqual({ test: 'it works!' });
  });

  it('createReducers should return object containing reducers with after dispatch', async () => {
    jest.useFakeTimers();
    const EventManager = {
      onDispatch: jest.fn(() => ({ test: 'it works!' })),
      afterDispatch: jest.fn(() => 'after dispatch triggered!'),
    };
    const TestEvent = new Event({ name: 'testEvent', manager: EventManager });
    const reducers = TestEvent.createReducers();

    expect(reducers).toHaveProperty('testEvent');
    expect(typeof reducers.testEvent).toBe('function');

    expect(reducers.testEvent({}, { type: 'notThisOne' })).toEqual({});
    expect(EventManager.onDispatch).not.toBeCalled();

    expect(reducers.testEvent({}, { type: 'TEST_EVENT' })).toEqual({ test: 'it works!' });
    expect(EventManager.onDispatch).toBeCalled();

    expect(EventManager.afterDispatch).not.toBeCalled();
    jest.runAllTimers();
    expect(EventManager.afterDispatch).toBeCalledWith({}, { test: 'it works!' });
  });

  it('register should throw if no Component is passed', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });

    expect(() => TestEvent.register({ props: ['test'] })).toThrow(
      'You must pass a Component inside the Component key when registering it to an event.',
    );
  });

  it('register should call redux connect correctly', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    const Component = {};

    const returnedConnect = jest.fn(() => 'final return');
    redux.connect = jest.fn(() => returnedConnect);
    TestEvent._bindDataToProps = jest.fn(() => 'bound data');

    let returnedValue = TestEvent.register({ Component, props: ['test'] });
    expect(returnedValue).toBe('final return');

    expect(redux.connect).toHaveBeenCalledWith('bound data', TestEvent._bindDispatchToProps);
    expect(TestEvent._bindDataToProps).toHaveBeenCalledWith(['test']);
    expect(returnedConnect).toHaveBeenCalledWith(Component);

    returnedValue = TestEvent.register({ Component });
    expect(returnedValue).toBe('final return');

    expect(redux.connect).toHaveBeenCalledWith('bound data', TestEvent._bindDispatchToProps);
    expect(TestEvent._bindDataToProps).toHaveBeenCalledWith([]);
    expect(returnedConnect).toHaveBeenCalledWith(Component);
  });

  it('_chainEvents iterates listenTo array and calls correct functions for normal events', async () => {
    jest.useFakeTimers();
    const ListenedEventReturnFunction = jest.fn(() => ({
      reducerName: 'LISTENED_EVENT',
      __UNSAFE_state: '__UNSAFE_state',
    }));
    const TestEvent = new Event({
      name: 'testEvent',
      manager: {},
      listenTo: [{ event: ListenedEventReturnFunction, trigger: 'onDispatch' }],
    });
    const action = { type: 'LISTENED_EVENT', __UNSAFE_dispatch: jest.fn() };
    TestEvent.toRedux = jest.fn(() => 'toReduxCalled');
    expect(ListenedEventReturnFunction).not.toBeCalled();

    TestEvent._chainEvents(action);

    expect(ListenedEventReturnFunction).toBeCalled();
    expect(action.__UNSAFE_dispatch).not.toBeCalled();
    expect(TestEvent.toRedux).not.toBeCalled();

    jest.runAllTimers();
    expect(action.__UNSAFE_dispatch).toBeCalledWith('toReduxCalled');
    expect(TestEvent.toRedux).toBeCalledWith('__UNSAFE_state');
  });
});

describe('RequestEvent', () => {
  it('should initialize correctly', async () => {
    let TestEvent = new RequestEvent({ name: 'testEvent', manager: {} });
    expect(TestEvent).not.toHaveProperty('reducerName');
    expect(TestEvent.name).toEqual('testEvent');
    expect(TestEvent.manager).toEqual({});
    expect(TestEvent.listenTo).toEqual([]);
    expect(TestEvent.reducers).toEqual({
      request: 'TEST_EVENT_REQUEST',
      success: 'TEST_EVENT_SUCCESS',
      failure: 'TEST_EVENT_FAILURE',
    });

    const mockEvent = jest.fn(() => 'event');
    const listenTo = [{ event: mockEvent, trigger: 'onDispatch' }];
    TestEvent = new RequestEvent({ name: 'testEvent', manager: {}, listenTo });
    expect(TestEvent).not.toHaveProperty('reducerName');
    expect(TestEvent.name).toEqual('testEvent');
    expect(TestEvent.manager).toEqual({});
    expect(TestEvent.listenTo).toEqual(listenTo);
    expect(TestEvent.reducers).toEqual({
      request: 'TEST_EVENT_REQUEST',
      success: 'TEST_EVENT_SUCCESS',
      failure: 'TEST_EVENT_FAILURE',
    });
  });

  it('toRedux should return correct data', async () => {
    let EventManager = {
      call: jest.fn(() => 'api called'),
    };
    let TestEvent = new RequestEvent({ name: 'testEvent', manager: EventManager });
    let expectedReturn = {
      types: TestEvent.reducers,
      extraData: { test: 'data' },
      apiCallFunction: 'api called',
      shouldDispatch: expect.any(Function),
    };

    let toReduxReturn = TestEvent.toRedux({ test: 'data' });
    expect(toReduxReturn).toEqual(expectedReturn);
    expect(toReduxReturn.shouldDispatch()).toBeTruthy();

    EventManager = {
      call: jest.fn(() => 'api called'),
      shouldDispatch: () => false,
    };
    TestEvent = new RequestEvent({ name: 'testEvent', manager: EventManager });
    expectedReturn = {
      types: TestEvent.reducers,
      extraData: { test: 'data' },
      apiCallFunction: 'api called',
      shouldDispatch: EventManager.shouldDispatch,
    };

    toReduxReturn = TestEvent.toRedux({ test: 'data' });
    expect(toReduxReturn).toEqual(expectedReturn);
    expect(toReduxReturn.shouldDispatch()).toBeFalsy();
  });

  it('createReducers should return object containing reducers', async () => {
    const EventManager = {
      onDispatch: jest.fn(() => 'request dispatched'),
      onSuccess: jest.fn(() => 'success dispatched'),
      onFailure: jest.fn(() => 'failure dispatched'),
      call: jest.fn(),
      initialState: { initial: 'state' },
    };
    const TestEvent = new RequestEvent({ name: 'testEvent', manager: EventManager });
    const reducers = TestEvent.createReducers();

    expect(reducers).toHaveProperty('testEvent');
    expect(typeof reducers.testEvent).toBe('function');

    expect(reducers.testEvent(undefined, { type: 'notThisOne' })).toEqual(
      EventManager.initialState,
    );
    expect(EventManager.onDispatch).not.toBeCalled();
    expect(EventManager.onSuccess).not.toBeCalled();
    expect(EventManager.onFailure).not.toBeCalled();

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_REQUEST' })).toEqual('request dispatched');
    expect(EventManager.onDispatch).toBeCalledWith({}, { type: 'TEST_EVENT_REQUEST' });

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_SUCCESS' })).toEqual('success dispatched');
    expect(EventManager.onSuccess).toBeCalledWith({}, { type: 'TEST_EVENT_SUCCESS' });

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_FAILURE' })).toEqual('failure dispatched');
    expect(EventManager.onFailure).toBeCalledWith({}, { type: 'TEST_EVENT_FAILURE' });
  });

  it('createReducers should return object containing reducers with after success and failure', async () => {
    jest.useFakeTimers();

    const EventManager = {
      onDispatch: jest.fn(() => 'request dispatched'),
      onSuccess: jest.fn(() => 'success dispatched'),
      onFailure: jest.fn(() => 'failure dispatched'),
      afterSuccess: jest.fn(() => 'success dispatched'),
      afterFailure: jest.fn(() => 'failure dispatched'),
      call: jest.fn(),
    };
    const TestEvent = new RequestEvent({ name: 'testEvent', manager: EventManager });
    const reducers = TestEvent.createReducers();

    expect(reducers).toHaveProperty('testEvent');
    expect(typeof reducers.testEvent).toBe('function');

    expect(reducers.testEvent({}, { type: 'notThisOne' })).toEqual({});
    expect(EventManager.onDispatch).not.toBeCalled();
    expect(EventManager.onSuccess).not.toBeCalled();
    expect(EventManager.onFailure).not.toBeCalled();

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_REQUEST' })).toEqual('request dispatched');
    expect(EventManager.onDispatch).toBeCalledWith({}, { type: 'TEST_EVENT_REQUEST' });

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_SUCCESS' })).toEqual('success dispatched');
    expect(EventManager.onSuccess).toBeCalledWith({}, { type: 'TEST_EVENT_SUCCESS' });

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_FAILURE' })).toEqual('failure dispatched');
    expect(EventManager.onFailure).toBeCalledWith({}, { type: 'TEST_EVENT_FAILURE' });

    expect(EventManager.afterSuccess).not.toBeCalled();
    expect(EventManager.afterFailure).not.toBeCalled();
    jest.runAllTimers();
    expect(EventManager.afterSuccess).toBeCalledWith({}, 'success dispatched');
    expect(EventManager.afterFailure).toBeCalledWith({}, 'failure dispatched');
  });

  it('_chainEvents iterates listenTo array and calls correct functions for request events', async () => {
    jest.useFakeTimers();
    const ListenedEventReturnFunction = jest.fn(() => ({
      reducers: { onSuccess: 'LISTENED_EVENT' },
      __UNSAFE_state: '__UNSAFE_state',
    }));
    const TestEvent = new Event({
      name: 'testEvent',
      manager: {},
      listenTo: [{ event: ListenedEventReturnFunction, trigger: 'onSuccess' }],
    });
    const action = { type: 'LISTENED_EVENT', __UNSAFE_dispatch: jest.fn() };
    TestEvent.toRedux = jest.fn(() => 'toReduxCalled');
    expect(ListenedEventReturnFunction).not.toBeCalled();

    TestEvent._chainEvents(action);

    expect(ListenedEventReturnFunction).toBeCalled();
    expect(action.__UNSAFE_dispatch).not.toBeCalled();
    expect(TestEvent.toRedux).not.toBeCalled();

    jest.runAllTimers();
    expect(action.__UNSAFE_dispatch).toBeCalledWith('toReduxCalled');
    expect(TestEvent.toRedux).toBeCalledWith('__UNSAFE_state');
  });

  it('_chainEvents iterates listenTo array and does not call for unmatched trigger', async () => {
    jest.useFakeTimers();
    const ListenedEventReturnFunction = jest.fn(() => ({
      reducers: { onSuccess: 'LISTENED_EVENT' },
      __UNSAFE_state: '__UNSAFE_state',
    }));
    const TestEvent = new Event({
      name: 'testEvent',
      manager: {},
      listenTo: [{ event: ListenedEventReturnFunction, trigger: 'onDispatch' }],
    });
    const action = { type: 'LISTENED_EVENT', __UNSAFE_dispatch: jest.fn() };
    TestEvent.toRedux = jest.fn(() => 'toReduxCalled');
    expect(ListenedEventReturnFunction).not.toBeCalled();

    TestEvent._chainEvents(action);

    expect(ListenedEventReturnFunction).toBeCalled();
    expect(action.__UNSAFE_dispatch).not.toBeCalled();
    expect(TestEvent.toRedux).not.toBeCalled();

    jest.runAllTimers();
    expect(action.__UNSAFE_dispatch).not.toBeCalled();
    expect(TestEvent.toRedux).not.toBeCalled();
  });

  it('_chainEvents iterates listenTo array and does not call strange events', async () => {
    jest.useFakeTimers();
    const ListenedEventReturnFunction = jest.fn(() => ({
      reducers: { onSuccess: 'LISTENED_EVENT' },
      __UNSAFE_state: '__UNSAFE_state',
    }));
    const TestEvent = new Event({
      name: 'testEvent',
      manager: {},
      listenTo: [{ event: ListenedEventReturnFunction, trigger: 'onSuccess' }],
    });
    const action = { type: 'NOT_LISTENED_EVENT', __UNSAFE_dispatch: jest.fn() };
    TestEvent.toRedux = jest.fn(() => 'toReduxCalled');
    expect(ListenedEventReturnFunction).not.toBeCalled();

    TestEvent._chainEvents(action);

    expect(ListenedEventReturnFunction).toBeCalled();
    expect(action.__UNSAFE_dispatch).not.toBeCalled();
    expect(TestEvent.toRedux).not.toBeCalled();

    jest.runAllTimers();
    expect(action.__UNSAFE_dispatch).not.toBeCalled();
    expect(TestEvent.toRedux).not.toBeCalled();
  });
});

describe('getCurrentStateFromEvent', () => {
  it('should throw if we do not pass an event', async () => {
    expect(() => getCurrentStateFromEvent({})).toThrow('You need to pass an event.');
  });

  it('should throw if we do not pass the appState', async () => {
    expect(() => getCurrentStateFromEvent({ event: {} })).toThrow(
      'You need to pass your app state. This is only available inside `shouldDispatch` methods or imported manually (not recommended).',
    );
  });

  it('should return correct data', async () => {
    expect(
      getCurrentStateFromEvent({ event: { name: 'testEvent' }, appState: { testEvent: 'data' } }),
    ).toEqual('data');
  });
});

describe('dispatchEvent', () => {
  it('should throw if we do not pass an event', async () => {
    expect(() => dispatchEvent({})).toThrow('You need to pass an event.');
  });

  it('should throw if we do not pass an event with a toRedux method', async () => {
    expect(() => dispatchEvent({ event: {} })).toThrow(
      'The event you passed needs to have a `toRedux` method. Are you sure you instantiated and passed the correct event?',
    );
  });

  it('should throw if we do not pass a store', async () => {
    expect(() => dispatchEvent({ event: { toRedux: () => {} } })).toThrow(
      'You need to pass your redux store.',
    );
  });

  it('should throw if we do not pass a store with a dispatch method', async () => {
    expect(() => dispatchEvent({ event: { toRedux: () => {} }, store: {} })).toThrow(
      'The store you passed does not have a `dispatch` method. Are you sure you passed the correct variable as the store?',
    );
  });

  it('should call store.dispatch passing event.redux with data', async () => {
    const event = {
      toRedux: jest.fn(),
    };
    const store = {
      dispatch: jest.fn(),
    };

    dispatchEvent({ event, store, data: { test: 'data' } });

    expect(event.toRedux).toHaveBeenCalledWith({ test: 'data' });
    expect(store.dispatch).toHaveBeenCalledWith(event.toRedux({ test: 'data' }));
  });
});
