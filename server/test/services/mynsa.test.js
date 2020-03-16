const assert = require('assert');
const app = require('../../src/app');

describe('\'mynsa\' service', () => {
  it('registered the service', () => {
    const service = app.service('mynsa');

    assert.ok(service, 'Registered the service');
  });
});
