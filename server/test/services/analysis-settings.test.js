const assert = require('assert');
const app = require('../../src/app');

describe('\'analysisSettings\' service', () => {
  it('registered the service', () => {
    const service = app.service('analysis-settings');

    assert.ok(service, 'Registered the service');
  });
});
