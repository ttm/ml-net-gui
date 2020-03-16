const assert = require('assert');
const app = require('../../src/app');

describe('\'usage\' service', () => {
  it('registered the service', () => {
    const service = app.service('usage');

    assert.ok(service, 'Registered the service');
  });
});
