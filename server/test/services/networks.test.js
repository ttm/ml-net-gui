const assert = require('assert');
const app = require('../../src/app');

describe('\'networks\' service', () => {
  it('registered the service', () => {
    const service = app.service('networks');

    assert.ok(service, 'Registered the service');
  });
});
