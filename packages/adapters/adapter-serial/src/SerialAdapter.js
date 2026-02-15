import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

import { EventBus } from "./EventBus.js";
import { Parser } from "./Parser.js";

/**
 * USB/Serial adapter
 */
export class SerialAdapter {
  constructor(path, baud = 115200) {
    this.path = path;
    this.baud = baud;

    this.bus = new EventBus();
    this.parser = new Parser();

    this._port = null;
  }

  async connect() {
    this._port = new SerialPort({
      path: this.path,
      baudRate: this.baud,
    });

    const rl = this._port.pipe(
      new ReadlineParser({
        delimiter: "\n",
      }),
    );

    rl.on("data", (line) => {
      const evt = this.parser.parse(line);

      if (evt) {
        this.bus.emit(evt);
      } else {
        this.bus.emit({
          type: "TEXT",
          text: line.trim(),
          t: Date.now(),
          source: "serial",
        });
      }
    });
  }

  disconnect() {
    if (this._port) {
      this._port.close();
      this._port = null;
    }
  }

  onPoint(fn) {
    return this.bus.subscribe(fn);
  }

  writeLine(line) {
    if (!this._port) return false;
    this._port.write(`${line}\n`);
    return true;
  }
}
