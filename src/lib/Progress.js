class Progress {
  constructor() {
    this.reset();
  }

  get visible() {
    return !(this.pointsReady && this.linksReady && this.treeReady);
  }

  setError(errorMessage, details) {
    this.errorMessage = errorMessage;
    this.errorDetails = details;
  }

  reset() {
    this.errorMessage = null;
    this.errorDetails = null;
    this.message = '';
    this.completed = '';
    this.pointsReady = false;
    this.linksReady = false;
    this.treeReady = false;
  }
}

module.exports = Progress;