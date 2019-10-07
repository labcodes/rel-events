import { dispatchEvent, getCurrentStateFromEvent } from '../lib/helpers';

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
