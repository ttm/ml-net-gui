const { authenticate } = require('@feathersjs/authentication').hooks;

const getLocation = require('../../hooks/get-location');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      authenticate('jwt'),
      getLocation()
    ],
    update: [
      authenticate('jwt'),
      getLocation()
    ],
    patch: [
      authenticate('jwt'),
      getLocation()
    ],
    remove: [
      authenticate('jwt')
    ]
  },

  after: {
    all: [],
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
