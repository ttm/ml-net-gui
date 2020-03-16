const { authenticate } = require('@feathersjs/authentication').hooks;
const { restrictToRoles } = require('feathers-authentication-hooks');
const { populate } = require('feathers-hooks-common');

const roleSchema = {
  include: [
    {
      service: 'users',
      nameAs: 'userObj',
      parentField: 'user',
      childField: '_id'
    },
    {
      service: 'coment',
      nameAs: 'answerObj',
      parentField: 'answer',
      childField: '_id'
    }
  ]
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
