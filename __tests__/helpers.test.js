import {
  dispatchEvent,
  getCurrentStateFromEvent,
  combineEventReducers,
  _combineConflictingReducers,
  // eslint-disable-next-line import/named
  __RewireAPI__,
} from '../lib/helpers';

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

describe('combineEventReducers', () => {
  it('should call return empty object if passed nothing', async () => {
    expect(combineEventReducers()).toEqual({});
    expect(combineEventReducers([])).toEqual({});
  });

  it('should return object with reducers if passed events', async () => {
    const dummyEvents = [
      { name: 'event1', createReducers: () => ({ event1: 'called1' }) },
      { name: 'event2', createReducers: () => ({ event2: 'called2' }) },
    ];
    expect(combineEventReducers(dummyEvents)).toEqual({
      event1: 'called1',
      event2: 'called2',
    });
  });

  it('should throw if passed `useDataFrom` key pointing at unexisting event', async () => {
    const dummyEvents = [
      { name: 'event1', createReducers: () => ({ event1: 'called1' }) },
      {
        name: 'event2',
        useDataFrom: 'unexistingEvent',
        createReducers: () => ({ event2: 'called2' }),
      },
    ];
    expect(() => combineEventReducers(dummyEvents)).toThrow(
      'Event with unexistingEvent name not found.',
    );
  });

  it('should call _combineConflictingReducers if `useDataFrom` key exists in an event', async () => {
    const dummyEvents = [
      { name: 'event1', createReducers: () => ({ event1: 'called1' }) },
      {
        name: 'event2',
        useDataFrom: 'event1',
        createReducers: () => ({ event2: 'called2' }),
      },
      {
        name: 'event3',
        useDataFrom: 'event1',
        createReducers: () => ({ event3: 'called3' }),
      },
    ];

    const mockedCombineConflictingReducers = jest.fn(() => ({ test: 'return' }));
    __RewireAPI__.__Rewire__('_combineConflictingReducers', mockedCombineConflictingReducers);

    const returnedData = combineEventReducers(dummyEvents);

    expect(mockedCombineConflictingReducers).toHaveBeenCalledWith([
      { event1: 'called1' },
      { event2: 'called2' },
      { event3: 'called3' },
    ]);
    expect(returnedData).toEqual({
      event1: { test: 'return' },
    });
  });
});

describe('_combineConflictingReducers', () => {
  it('returns function that returns same state if passed nothing', async () => {
    const returnedFunction = _combineConflictingReducers();
    expect(returnedFunction({ test: 'state' })).toEqual({ test: 'state' });
  });

  it('returns function that combines alterations of the same state', async () => {
    const dummyReducers = [
      {
        event1: state => {
          state.event1 = 'test1';
          return state;
        },
      },
      {
        event2: state => {
          state.event2 = 'test2';
          return state;
        },
      },
    ];

    const returnedFunction = _combineConflictingReducers(dummyReducers);

    expect(returnedFunction({ test: 'state' })).toEqual({
      test: 'state',
      event1: 'test1',
      event2: 'test2',
    });
  });
});
