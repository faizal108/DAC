export const MENU = [
  {
    id: "file",
    label: "File",
    items: [
      {
        id: "file.save",
        label: "Save",
        feature: "SAVE_PROJECT",
      },

      {
        id: "file.export.dxf",
        label: "Export DXF",
        feature: "EXPORT_DXF",
      },

      {
        id: "file.export.gcode",
        label: "Export GCode",
        feature: "EXPORT_GCODE",
      },
      {
        id: "file.export.image",
        label: "Export Image",
        feature: "EXPORT_IMAGE",
      },
    ],
  },

  {
    id: "tools",
    label: "Tools",
    items: [
      {
        id: "tool.trim",
        label: "Trim",
        feature: "ADVANCED_TRIM",
      },

      {
        id: "tool.circle",
        label: "Circle",
        feature: "CIRCLE_TOOL",
      },
    ],
  },

  {
    id: "machine",
    label: "Machine",
    items: [
      {
        id: "machine.capture",
        label: "Start Capture",
        feature: "CAPTURE",
      },
    ],
  },
];
