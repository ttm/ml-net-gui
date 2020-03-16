const { authenticate } = require('@feathersjs/authentication').hooks;
const { restrictToRoles } = require('feathers-authentication-hooks');
const { populate, fastJoin } = require('feathers-hooks-common');
const removeRelations = require('../../hooks/remove-relations');

const roleSchema = {
  include: [
    {
      service: 'users',
      nameAs: 'userObj',
      parentField: 'user',
      childField: '_id'
    },
    {
      service: 'foto',
      nameAs: 'capaObj',
      parentField: 'capa',
      childField: '_id'
    }
  ]
};

const itemResolvers = {
  joins: {
    fotos: (...args) => async (todo, context) => todo.fotos = (await context.app.service('foto').find({query: {item: todo._id, ref: 'todo'}})).total,
    members: (...args) => async (todo, context) => todo.members = (await context.app.service('relation').find({query: {item: todo._id, ref: 'todo', type: 'membership', $limit: 5}})).data,
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
    patch: [...restrict],
    remove: [
      ...restrict
    ]
  },

  after: {
    all: [
      populate({ schema: roleSchema }),
      fastJoin(itemResolvers)
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [
      removeRelations()
    ]
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
