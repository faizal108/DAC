export class LocalProvider {
  load() {
    return Promise.resolve({
      user: {
        id: "demo",
        tier: "free",
      },

      capabilities: {
        SAVE_PROJECT: true,
        EXPORT_DXF: false,
        EXPORT_GCODE: false,

        ADVANCED_TRIM: true,
        CIRCLE_TOOL: true,

        CAPTURE: true,
      },
    });
  }
}
