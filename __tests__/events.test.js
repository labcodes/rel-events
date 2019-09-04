import * as redux from 'react-redux';

import { Event, RequestEvent, dispatchEvent } from '../lib/events';

describe('Event', () => {
  it('should initialize correctly', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    expect(TestEvent.name).toEqual('testEvent');
    expect(TestEvent.manager).toEqual({});
    expect(TestEvent.reducerName).toEqual('TEST_EVENT');
  });

  it('should throw error when initializing without name', async () => {
    expect(() => new Event({})).toThrow('An Event should be initialized with an event name.');
  });

  it('should throw error when initializing without manager', async () => {
    expect(() => new Event({ name: 'testEvent' })).toThrow(
      'An Event should be initialized with an EventManager.',
    );
  });

  it('_dispatch should call toRedux passing data using redux dispatch', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    TestEvent.toRedux = jest.fn();
    const data = { test: 'data' };
    const reduxDispatch = jest.fn();

    TestEvent._dispatch(reduxDispatch)(data);

    expect(reduxDispatch).toBeCalled();
    expect(TestEvent.toRedux).toBeCalledWith(data);
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
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    const expectedReturn = {
      type: 'TEST_EVENT',
      test: 'yes',
    };

    expect(TestEvent.toRedux({ test: 'yes' })).toEqual(expectedReturn);
  });

  it('createReducers should return object containing reducers', async () => {
    const EventManager = {
      onDispatch: jest.fn(() => ({ test: 'it works!' })),
      initialState: { initial: 'state' },
    };
    const TestEvent = new Event({ name: 'testEvent', manager: EventManager });
    const reducers = TestEvent.createReducers();

    expect(reducers).toHaveProperty('testEvent');
    expect(typeof reducers.testEvent).toBe('function');

    expect(reducers.testEvent(undefined, { type: 'notThisOne' })).toEqual(
      EventManager.initialState,
    );
    expect(EventManager.onDispatch).not.toBeCalled();

    expect(reducers.testEvent({}, { type: 'TEST_EVENT' })).toEqual({ test: 'it works!' });
    expect(EventManager.onDispatch).toBeCalled();
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

    expect(() => TestEvent.register({ listenTo: ['test'] })).toThrow(
      'You must pass a Component inside the Component key when registering it to an event.',
    );
  });

  it('register should call redux connect correctly', async () => {
    const TestEvent = new Event({ name: 'testEvent', manager: {} });
    const Component = {};

    const returnedConnect = jest.fn(() => 'final return');
    redux.connect = jest.fn(() => returnedConnect);
    TestEvent._bindDataToProps = jest.fn(() => 'bound data');

    let returnedValue = TestEvent.register({ Component, listenTo: ['test'] });
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
});

describe('RequestEvent', () => {
  it('should initialize correctly', async () => {
    const TestEvent = new RequestEvent({ name: 'testEvent', manager: {} });
    expect(TestEvent).not.toHaveProperty('reducerName');
    expect(TestEvent.name).toEqual('testEvent');
    expect(TestEvent.manager).toEqual({});
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
      shouldCallApi: expect.any(Function),
    };

    let toReduxReturn = TestEvent.toRedux({ test: 'data' });
    expect(toReduxReturn).toEqual(expectedReturn);
    expect(toReduxReturn.shouldCallApi()).toBeTruthy();

    EventManager = {
      call: jest.fn(() => 'api called'),
      shouldCallApi: () => false,
    };
    TestEvent = new RequestEvent({ name: 'testEvent', manager: EventManager });
    expectedReturn = {
      types: TestEvent.reducers,
      extraData: { test: 'data' },
      apiCallFunction: 'api called',
      shouldCallApi: EventManager.shouldCallApi,
    };

    toReduxReturn = TestEvent.toRedux({ test: 'data' });
    expect(toReduxReturn).toEqual(expectedReturn);
    expect(toReduxReturn.shouldCallApi()).toBeFalsy();
  });

  it('createReducers should return object containing reducers', async () => {
    const EventManager = {
      onRequest: jest.fn(() => 'request dispatched'),
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
    expect(EventManager.onRequest).not.toBeCalled();
    expect(EventManager.onSuccess).not.toBeCalled();
    expect(EventManager.onFailure).not.toBeCalled();

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_REQUEST' })).toEqual('request dispatched');
    expect(EventManager.onRequest).toBeCalledWith({}, { type: 'TEST_EVENT_REQUEST' });

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_SUCCESS' })).toEqual('success dispatched');
    expect(EventManager.onSuccess).toBeCalledWith({}, { type: 'TEST_EVENT_SUCCESS' });

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_FAILURE' })).toEqual('failure dispatched');
    expect(EventManager.onFailure).toBeCalledWith({}, { type: 'TEST_EVENT_FAILURE' });
  });

  it('createReducers should return object containing reducers with after success and failure', async () => {
    jest.useFakeTimers();

    const EventManager = {
      onRequest: jest.fn(() => 'request dispatched'),
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
    expect(EventManager.onRequest).not.toBeCalled();
    expect(EventManager.onSuccess).not.toBeCalled();
    expect(EventManager.onFailure).not.toBeCalled();

    expect(reducers.testEvent({}, { type: 'TEST_EVENT_REQUEST' })).toEqual('request dispatched');
    expect(EventManager.onRequest).toBeCalledWith({}, { type: 'TEST_EVENT_REQUEST' });

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
