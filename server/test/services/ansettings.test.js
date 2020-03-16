const assert = require('assert');
const app = require('../../src/app');

describe('\'ansettings\' service', () => {
  it('registered the service', () => {
    const service = app.service('ansettings');

    assert.ok(service, 'Registered the service');
  });
});
