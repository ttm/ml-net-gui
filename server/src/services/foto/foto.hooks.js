const { authenticate } = require('@feathersjs/authentication').hooks;
const { restrictToRoles } = require('feathers-authentication-hooks');
const { iff, isProvider, preventChanges, populate, fastJoin } = require('feathers-hooks-common');

const roleSchema = {
  include: [
    {
      service: 'users',
      nameAs: 'userObj',
      parentField: 'user',
      childField: '_id'
    }
  ]
};

const itemResolvers = {
  joins: {
    itemObj: (...args) => async (foto, context) => foto.itemObj = (await context.app.service(foto.ref).get(foto.item))
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

const fotoUpdate = require('../../hooks/foto-update');

const removeFoto = require('../../hooks/remove-foto');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [authenticate('jwt')],
    update: [...restrict],
    patch: [
      iff(isProvider('external'),
        preventChanges([
          'url',
          'sm',
          'md',
          'lg',
          'user',
          'item',
          'ref',
          'key',
          'size'
        ])
      )
    ],
    remove: [
      ...restrict,
      removeFoto()
    ]
  },

  after: {
    all: [
      populate({ schema: roleSchema }),
      fastJoin(itemResolvers)
    ],
    find: [],
    get: [],
    create: [fotoUpdate()],
    update: [fotoUpdate()],
    patch: [fotoUpdate()],
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
