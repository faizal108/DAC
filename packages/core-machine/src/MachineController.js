  import {
  AddEntityCommand,
} from "@dac/core-commands";

import {
  createPoint,
  createLine,
} from "@dac/core-geometry";

/**
 * Bridges machine input to DAC
 */
export class MachineController {
  constructor(commandManager) {
    this.mgr = commandManager;

    this._last = null;
  }

  onEvent(evt) {
    if (evt.type !== "POINT") return;

    const p = createPoint(
      evt.x,
      evt.y
    );

    // First point
    if (!this._last) {
      this._last = p;

      this.mgr.execute(
        new AddEntityCommand(p)
      );

      return;
    }

    // Draw line from last point
    const line = createLine(
      this._last,
      p
    );

    this.mgr.execute(
      new AddEntityCommand(line)
    );

    this._last = p;
  }

  reset() {
    this._last = null;
  }
}
