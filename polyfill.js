if (!global.performance) {
  try {
    global.performance = require('perf_hooks').performance;
  } catch (e) {
    console.warn('Failed to polyfill performance', e);
  }
}
