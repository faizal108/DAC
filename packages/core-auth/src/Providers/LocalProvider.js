export class LocalProvider {
  load() {
    return Promise.resolve({
      user: {
        id: "demo",
        tier: "free",
      },

      capabilities: {
        EXPORT_DXF: false,
        ADVANCED_TRIM: true,
        CLOUD_SYNC: false,
      },
    });
  }
}
