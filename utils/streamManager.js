const StreamInstance = require("./stream-instance");

class DVRManager {
  constructor() {
    this.streams = new Map();
  }

  getStream(dvrId) {
    return this.streams.get(dvrId);
  }

  createStream(dvrId, rtspUrl) {
    if (!this.streams.has(dvrId)) {
      this.streams.set(dvrId, new StreamInstance(dvrId, rtspUrl));
    }
    return this.streams.get(dvrId);
  }

  removeStream(dvrId) {
    this.streams.delete(dvrId);
  }
}

module.exports = new DVRManager();
