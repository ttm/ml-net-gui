const assert = require('assert');
const app = require('../../src/app');

describe('\'foto\' service', () => {
  it('registered the service', () => {
    const service = app.service('foto');

    assert.ok(service, 'Registered the service');
  });
});
