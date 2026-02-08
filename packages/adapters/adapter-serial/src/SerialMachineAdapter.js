import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

export class SerialMachineAdapter {
  constructor({ path, baudRate = 115200 }) {
    this.path = path;
    this.baudRate = baudRate;

    this.port = null;
    this.parser = null;

    this._listeners = new Set();
  }

  connect() {
    if (this.port) return;

    this.port = new SerialPort({
      path: this.path,
      baudRate: this.baudRate,
      autoOpen: false,
    });

    this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\n" }));

    this.parser.on("data", (line) => {
      const trimmed = line.trim();
      if (trimmed.length) {
        this._emit(trimmed);
      }
    });

    this.port.open((err) => {
      if (err) {
        console.error("Serial open error:", err.message);
      }
    });
  }

  disconnect() {
    if (!this.port) return;

    this.port.close();
    this.port = null;
    this.parser = null;
  }

  onData(fn) {
    this._listeners.add(fn);
  }

  offData(fn) {
    this._listeners.delete(fn);
  }

  _emit(data) {
    for (const fn of this._listeners) {
      fn(data);
    }
  }
}
