const assert = require('assert');
const app = require('../../src/app');

describe('\'endereco\' service', () => {
  it('registered the service', () => {
    const service = app.service('endereco');

    assert.ok(service, 'Registered the service');
  });
});
