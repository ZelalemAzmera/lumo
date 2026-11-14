import { describe, it, expect, vi } from 'vitest';
import { StateMachine } from '../../packages/core/src/player/StateMachine';

describe('StateMachine', () => {
  it('initializes to IDLE by default', () => {
    const sm = new StateMachine();
    expect(sm.getState()).toBe('IDLE');
  });

  it('allows valid sequential transitions', () => {
    const sm = new StateMachine('IDLE');

    expect(sm.transitionTo('LOADING')).toBe(true);
    expect(sm.getState()).toBe('LOADING');

    expect(sm.transitionTo('PLAYING')).toBe(true);
    expect(sm.getState()).toBe('PLAYING');

    expect(sm.transitionTo('PAUSED')).toBe(true);
    expect(sm.getState()).toBe('PAUSED');

    expect(sm.transitionTo('PLAYING')).toBe(true);
    expect(sm.getState()).toBe('PLAYING');

    expect(sm.transitionTo('ENDED')).toBe(true);
    expect(sm.getState()).toBe('ENDED');
  });

  it('rejects invalid state transitions', () => {
    const sm = new StateMachine('IDLE');
    // IDLE cannot transition directly to ENDED
    expect(sm.canTransitionTo('ENDED')).toBe(false);
    expect(sm.transitionTo('ENDED')).toBe(false);
    expect(sm.getState()).toBe('IDLE');
  });

  it('notifies subscribers on state change', () => {
    const sm = new StateMachine('IDLE');
    const listener = vi.fn();
    const unsubscribe = sm.subscribe(listener);

    sm.transitionTo('LOADING');
    expect(listener).toHaveBeenCalledWith('LOADING', 'IDLE');

    unsubscribe();
    sm.transitionTo('PLAYING');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
