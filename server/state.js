// In-memory state for v1.0
// Stores the most recent UID that was scanned but not recognized in the system

const state = {
  lastUnknownScan: {
    uid: null,
    scannedAt: null,
  },
  setLastUnknown(uid) {
    this.lastUnknownScan = {
      uid: uid ? uid.toString().trim().toUpperCase() : null,
      scannedAt: new Date().toISOString(),
    };
  },
  getLastUnknown() {
    return this.lastUnknownScan;
  },
  clearLastUnknown() {
    this.lastUnknownScan = {
      uid: null,
      scannedAt: null,
    };
  },
};

module.exports = state;
