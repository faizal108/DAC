import { normalizePoint } from "./normalize/normalizePoint.js";

const STATE = {
  IDLE: "IDLE",
  CAPTURING: "CAPTURING",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
};

export class MachineSession {
  constructor({ previewLimit = 1000, inputUnit = "um" } = {}) {
    this.state = STATE.IDLE;

    this.points = []; // full capture
    this.preview = []; // rolling buffer

    this.previewLimit = previewLimit;
    this.inputUnit = inputUnit;

    this._listeners = {
      point: new Set(),
      state: new Set(),
      reset: new Set(),
    };
  }

  /* ---------- lifecycle ---------- */

  start() {
    if (this.state !== STATE.IDLE && this.state !== STATE.STOPPED) return;

    this.points = [];
    this.preview = [];
    this._setState(STATE.CAPTURING);
    this._emit("reset");
  }

  pause() {
    if (this.state !== STATE.CAPTURING) return;
    this._setState(STATE.PAUSED);
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this._setState(STATE.CAPTURING);
  }

  stop() {
    if (this.state === STATE.IDLE) return;
    this._setState(STATE.STOPPED);
  }

  /* ---------- data ingestion ---------- */

  ingest(rawInput) {
    if (this.state !== STATE.CAPTURING) return;

    const pt = normalizePoint(rawInput, { unit: this.inputUnit });
    if (!pt) return;

    this.points.push(pt);
    this.preview.push(pt);

    // rolling buffer
    if (this.preview.length > this.previewLimit) {
      this.preview.shift();
    }

    this._emit("point", pt);
  }

  setInputUnit(unit) {
    this.inputUnit = unit || "um";
  }

  /* ---------- subscriptions ---------- */

  on(event, fn) {
    this._listeners[event]?.add(fn);
  }

  off(event, fn) {
    this._listeners[event]?.delete(fn);
  }

  /* ---------- internals ---------- */

  _setState(s) {
    this.state = s;
    this._emit("state", s);
  }

  _emit(event, payload) {
    for (const fn of this._listeners[event] || []) {
      fn(payload);
    }
  }
}
