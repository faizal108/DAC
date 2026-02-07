/**
 * Simple event bus
 */
export class EventBus {
  constructor() {
    this._subs = new Set();
  }

  subscribe(fn) {
    this._subs.add(fn);

    return () => this._subs.delete(fn);
  }

  emit(event) {
    for (const fn of this._subs) {
      fn(event);
    }
  }

  clear() {
    this._subs.clear();
  }
}
