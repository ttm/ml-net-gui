const assert = require('assert');
const app = require('../../src/app');

describe('\'coment\' service', () => {
  it('registered the service', () => {
    const service = app.service('coment');

    assert.ok(service, 'Registered the service');
  });
});
