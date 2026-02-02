import { Scene } from "./Scene.js";

/**
 * Scene serializer
 */
export class Serializer {
  static SCHEMA_VERSION = 1;

  /**
   * Serialize scene to JSON object
   */
  static serialize(scene) {
    return {
      schemaVersion: Serializer.SCHEMA_VERSION,

      meta: {
        savedAt: Date.now(),
        version: scene.version,
      },

      layers: scene.layers.getAll(),

      entities: scene.getAll().map((e) => ({
        id: e.id,
        type: e.type,
        geometry: e.geometry,
        layerId: e.layerId,
        visible: e.visible,
        locked: e.locked,
        meta: e.meta,
      })),
    };
  }

  /**
   * Load scene from JSON object
   */
  static deserialize(data) {
    if (!data || data.schemaVersion !== Serializer.SCHEMA_VERSION) {
      throw new Error("Unsupported schema version");
    }

    const scene = new Scene();

    // Reset default layer
    scene.layers._layers.clear();

    // Restore layers
    for (const l of data.layers) {
      scene.layers.createLayer(l.id, l);
    }

    // Restore entities
    for (const e of data.entities) {
      scene._store.add(e);
      scene.index.insert(e);
    }

    scene.version = data.meta.version || 0;

    return scene;
  }
}
