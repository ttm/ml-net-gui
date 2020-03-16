const assert = require('assert');
const app = require('../../src/app');

describe('\'membership\' service', () => {
  it('registered the service', () => {
    const service = app.service('membership');

    assert.ok(service, 'Registered the service');
  });
});
