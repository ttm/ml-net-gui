const assert = require('assert');
const app = require('../../src/app');

describe('\'layouts\' service', () => {
  it('registered the service', () => {
    const service = app.service('layouts');

    assert.ok(service, 'Registered the service');
  });
});
