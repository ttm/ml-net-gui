const { authenticate } = require('@feathersjs/authentication').hooks;
const { restrictToRoles } = require('feathers-authentication-hooks');
const { iff, isProvider, preventChanges, fastJoin } = require('feathers-hooks-common');
const removeRelations = require('../../hooks/remove-relations');

const itemResolvers = {
  joins: {
    fromObj: (...args) => async (relation, context) => relation.fromObj = (await context.app.service(relation.fromref).get(relation.from)),
    toObj: (...args) => async (relation, context) => relation.toObj = (await context.app.service(relation.toref).get(relation.to))
  }
};

const restrict = [
  authenticate('jwt'),
  restrictToRoles({
    roles: ['admin', 'superadmin'],
    fieldName: 'roles',
    idField: '_id',
    ownerField: 'user',
    owner: true
  })
];

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [authenticate('jwt')],
    update: [...restrict],
    patch: [
      iff(
        isProvider('external'),    
        preventChanges([
          'from',
          'to',
          'toref',
          'fromref',
          'type'
        ])
      )
    ],
    remove: [
      iff(isProvider('external'),
        restrict
      )
    ]
  },

  after: {
    all: [
      fastJoin(itemResolvers)
    ],
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
