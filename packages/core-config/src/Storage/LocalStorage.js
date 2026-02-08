export class LocalStorage {
  load() {
    const s = localStorage.getItem("dac:config");

    return Promise.resolve(s ? JSON.parse(s) : {});
  }

  save(cfg) {
    localStorage.setItem("dac:config", JSON.stringify(cfg));

    return Promise.resolve();
  }
}
