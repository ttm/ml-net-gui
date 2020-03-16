const { populate } = require('feathers-hooks-common');

const roleSchema = {
  include: [
    {
      service: 'networks',
      nameAs: 'networkObj',
      parentField: 'network',
      childField: '_id'
    }
  ]
};

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [populate({ schema: roleSchema })],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
