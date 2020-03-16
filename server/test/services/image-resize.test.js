const assert = require('assert');
const app = require('../../src/app');

describe('\'image-resize\' service', () => {
  it('registered the service', () => {
    const service = app.service('image-resize');

    assert.ok(service, 'Registered the service');
  });
});
