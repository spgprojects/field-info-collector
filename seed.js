/* Field Info-Collector — SAMPLE configuration. Nothing here is a real facility, tag, or asset.
   This one file is the whole deployment: the SCHEMA (what to capture) and the REGISTER (what to
   capture it against). Replace it for a bespoke deployment; the app itself does not change.

   schema.slots   photo slots per asset. `skippable` slots can be skipped with a note.
   schema.fields  data fields per asset: text | number | select | check. `required` fields count
                  toward COLLECTED alongside the slots.
   register       areas and assets. `kind` picks the schematic placeholder shown before a photo exists.

   Planted defects in the sample register so the coverage report has something to say:
     8 assets missing CLASS · 3 missing a description · one tag used twice (PT-106) · 2 rows with no asset number */
window.SEED = {
  meta: {
    facility: "REPRESENTATIVE GAS PLANT",
    label: "Sample — synthetic",
    version: "sample-1",
  },

  schema: {
    slots: [
      { k: 1, label: "Close-up",    hint: "The component itself — what it is" },
      { k: 2, label: "Asset / tag", hint: "The tag plate or placard. No tag? Write it on a card and shoot that" },
      { k: 3, label: "Nameplate",   hint: "If readable and reachable. If not, skip WITH a note", skippable: true },
      { k: 4, label: "Context",     hint: "Where it sits — piping, supports, neighbours" },
      { k: 5, label: "Wide",        hint: "The whole unit from far enough back to find it again" },
    ],
    fields: [
      { k: "condition", label: "Condition",      type: "select", options: ["Serviceable", "Serviceable with defects", "Not serviceable", "Not assessed"], required: true },
      { k: "nameplate", label: "Nameplate reads", type: "text",   hint: "Model, serial, rating — as printed" },
      { k: "rating",    label: "Rating (HP / kW)", type: "number" },
      { k: "isolated",  label: "Isolated / blanked", type: "check" },
      { k: "notes",     label: "Notes",          type: "text",   hint: "What the next person needs to know" },
    ],
  },

  areas: {
    INL: "Inlet receiving and separation",
    CMP: "Compression",
    DEH: "Dehydration",
    MTR: "Metering",
    UTL: "Utilities and power",
  },
  assets: [
    { id: "A-001", area: "INL", tag: "V-101",   desc: "Inlet separator",                 cls: "VESSEL-SEP",   num: "100001", kind: "vessel" },
    { id: "A-002", area: "INL", tag: "PT-106",  desc: "Inlet pressure transmitter",      cls: "XMTR-PRESS",   num: "100002", kind: "xmtr" },
    { id: "A-003", area: "INL", tag: "PSV-101", desc: "Inlet separator relief valve",    cls: "",             num: "100003", kind: "psv" },
    { id: "A-004", area: "INL", tag: "LT-101",  desc: "Separator level transmitter",     cls: "XMTR-LEVEL",   num: "100004", kind: "xmtr" },
    { id: "A-005", area: "INL", tag: "XV-101",  desc: "Inlet ESD valve",                 cls: "VALVE-ESD",    num: "",       kind: "valve" },
    { id: "A-006", area: "INL", tag: "FT-102",  desc: "Inlet flow transmitter",          cls: "XMTR-FLOW",    num: "100006", kind: "xmtr" },

    { id: "A-010", area: "CMP", tag: "K-201A",  desc: "Recip compressor, unit A",        cls: "COMP-RECIP",   num: "100010", kind: "compressor" },
    { id: "A-011", area: "CMP", tag: "M-201A",  desc: "Compressor driver, unit A",       cls: "MOTOR-LV",     num: "100011", kind: "motor" },
    { id: "A-012", area: "CMP", tag: "V-201A",  desc: "Suction scrubber, unit A",        cls: "",             num: "100012", kind: "vessel" },
    { id: "A-013", area: "CMP", tag: "E-201A",  desc: "Discharge cooler, unit A",        cls: "HX-AIR",       num: "100013", kind: "exchanger" },
    { id: "A-014", area: "CMP", tag: "P-201A",  desc: "Lube oil pump, unit A",           cls: "PUMP-GEAR",    num: "100014", kind: "pump" },
    { id: "A-015", area: "CMP", tag: "PT-106",  desc: "Discharge pressure transmitter",  cls: "XMTR-PRESS",   num: "100015", kind: "xmtr" },
    { id: "A-016", area: "CMP", tag: "PSV-201A",desc: "",                                cls: "VALVE-PSV",    num: "100016", kind: "psv" },
    { id: "A-017", area: "CMP", tag: "K-201B",  desc: "Recip compressor, unit B",        cls: "COMP-RECIP",   num: "100017", kind: "compressor" },
    { id: "A-018", area: "CMP", tag: "M-201B",  desc: "Compressor driver, unit B",       cls: "",             num: "100018", kind: "motor" },
    { id: "A-019", area: "CMP", tag: "V-201B",  desc: "Suction scrubber, unit B",        cls: "VESSEL-SEP",   num: "100019", kind: "vessel" },
    { id: "A-020", area: "CMP", tag: "E-201B",  desc: "Discharge cooler, unit B",        cls: "",             num: "100020", kind: "exchanger" },
    { id: "A-021", area: "CMP", tag: "P-201B",  desc: "Lube oil pump, unit B",           cls: "PUMP-GEAR",    num: "",       kind: "pump" },

    { id: "A-030", area: "DEH", tag: "T-301",   desc: "Glycol contactor",                cls: "VESSEL-TOWER", num: "100030", kind: "vessel" },
    { id: "A-031", area: "DEH", tag: "P-305A",  desc: "Glycol circulation pump A",       cls: "PUMP-PD",      num: "100031", kind: "pump" },
    { id: "A-032", area: "DEH", tag: "P-305B",  desc: "Glycol circulation pump B",       cls: "",             num: "100032", kind: "pump" },
    { id: "A-033", area: "DEH", tag: "H-301",   desc: "Glycol reboiler",                 cls: "HEATER-FIRED", num: "100033", kind: "exchanger" },
    { id: "A-034", area: "DEH", tag: "TT-301",  desc: "",                                cls: "XMTR-TEMP",    num: "100034", kind: "xmtr" },
    { id: "A-035", area: "DEH", tag: "E-302",   desc: "Glycol/glycol exchanger",         cls: "HX-SHELL",     num: "100035", kind: "exchanger" },

    { id: "A-040", area: "MTR", tag: "FE-401",  desc: "Custody meter run 1",             cls: "METER-ORIFICE",num: "100040", kind: "meter" },
    { id: "A-041", area: "MTR", tag: "FE-402",  desc: "Custody meter run 2",             cls: "",             num: "100041", kind: "meter" },
    { id: "A-042", area: "MTR", tag: "GC-401",  desc: "Gas chromatograph",               cls: "ANALYZER-GC",  num: "100042", kind: "analyzer" },
    { id: "A-043", area: "MTR", tag: "PT-401",  desc: "Meter run pressure transmitter",  cls: "XMTR-PRESS",   num: "100043", kind: "xmtr" },

    { id: "A-050", area: "UTL", tag: "K-501",   desc: "Instrument air compressor",       cls: "COMP-SCREW",   num: "100050", kind: "compressor" },
    { id: "A-051", area: "UTL", tag: "V-501",   desc: "Air receiver",                    cls: "",             num: "100051", kind: "vessel" },
    { id: "A-052", area: "UTL", tag: "G-501",   desc: "Standby generator",               cls: "GENSET",       num: "100052", kind: "motor" },
    { id: "A-053", area: "UTL", tag: "MCC-501", desc: "",                                cls: "",             num: "100053", kind: "panel" },
    { id: "A-054", area: "UTL", tag: "UPS-501", desc: "Control room UPS",                cls: "UPS",          num: "100054", kind: "panel" },
    { id: "A-055", area: "UTL", tag: "P-501",   desc: "Methanol injection pump",         cls: "PUMP-PD",      num: "100055", kind: "pump" },
  ],
};
