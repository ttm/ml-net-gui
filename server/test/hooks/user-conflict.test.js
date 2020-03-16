const assert = require('assert');
const feathers = require('@feathersjs/feathers');
const userConflict = require('../../src/hooks/user-conflict');

describe('\'userConflict\' hook', () => {
  let app;

  beforeEach(() => {
    app = feathers();

    app.use('/dummy', {
      async get(id) {
        return { id };
      }
    });

    app.service('dummy').hooks({
      error: userConflict()
    });
  });

  it('runs the hook', async () => {
    const result = await app.service('dummy').get('test');
    
    assert.deepEqual(result, { id: 'test' });
  });
});
