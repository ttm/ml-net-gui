const assert = require('assert');
const app = require('../../src/app');

describe('\'checkemail\' service', () => {
  it('registered the service', () => {
    const service = app.service('checkemail');

    assert.ok(service, 'Registered the service');
  });
});
