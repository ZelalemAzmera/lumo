import { PlaybackState } from '../types/config';

export type StateChangeListener = (newState: PlaybackState, oldState: PlaybackState) => void;

export class StateMachine {
  private currentState: PlaybackState = 'IDLE';
  private listeners: StateChangeListener[] = [];

  private static validTransitions: Record<PlaybackState, PlaybackState[]> = {
    IDLE: ['LOADING', 'ERROR'],
    LOADING: ['PLAYING', 'PAUSED', 'ERROR'],
    PLAYING: ['PAUSED', 'ENDED', 'LOADING', 'ERROR'],
    PAUSED: ['PLAYING', 'LOADING', 'IDLE', 'ERROR'],
    ENDED: ['PLAYING', 'LOADING', 'IDLE'],
    ERROR: ['LOADING', 'IDLE']
  };

  constructor(initialState: PlaybackState = 'IDLE') {
    this.currentState = initialState;
  }

  public getState(): PlaybackState {
    return this.currentState;
  }

  public canTransitionTo(nextState: PlaybackState): boolean {
    const allowed = StateMachine.validTransitions[this.currentState];
    return allowed ? allowed.includes(nextState) : false;
  }

  public transitionTo(nextState: PlaybackState): boolean {
    if (this.currentState === nextState) return true;

    if (!this.canTransitionTo(nextState)) {
      console.warn(`[Lumo StateMachine] Invalid transition from ${this.currentState} to ${nextState}`);
      return false;
    }

    const oldState = this.currentState;
    this.currentState = nextState;

    for (const listener of this.listeners) {
      try {
        listener(nextState, oldState);
      } catch (err) {
        console.error('[Lumo StateMachine] Error in state listener:', err);
      }
    }

    return true;
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
