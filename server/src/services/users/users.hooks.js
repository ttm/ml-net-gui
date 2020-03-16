const { authenticate } = require('@feathersjs/authentication').hooks;
const { 
  isProvider, 
  iff, 
  preventChanges, 
  disallow, 
  discard, 
  when 
} = require('feathers-hooks-common');
const { restrictToRoles } = require('feathers-authentication-hooks');
const verifyHooks = require('feathers-authentication-management').hooks;
const accountService = require('../authmanagement/notifier');
const { populate, fastJoin } = require('feathers-hooks-common');
const removeRelations = require('../../hooks/remove-relations');

const roleSchema = {
  include: [
    {
      service: 'foto',
      nameAs: 'avatarObj',
      parentField: 'avatar',
      childField: '_id'
    },
    {
      service: 'foto',
      nameAs: 'capaObj',
      parentField: 'capa',
      childField: '_id'
    },
    {
      service: 'endereco',
      nameAs: 'enderecoObj',
      parentField: 'endereco',
      childField: '_id'
    }
  ]
};

const itemResolvers = {
  joins: {
    fotos: (...args) => async (user, context) => user.fotos = (await context.app.service('foto').find({query: {user: user._id}})).total,
    todos: (...args) => async (user, context) => user.todos = (await context.app.service('todo').find({query: {user: user._id}})).total
  }
};

const { hashPassword } = require('@feathersjs/authentication-local').hooks;
const restrict = [
  authenticate('jwt'),
  restrictToRoles({
    roles: ['admin', 'superadmin'],
    fieldName: 'roles',
    idField: '_id',
    ownerField: '_id',
    owner: true
  })
];

const mergeProfile = require('../../hooks/merge-profile');

const removeConnecting = require('../../hooks/remove-connecting');

const localAuth = require('../../hooks/local-auth');

const aggregate = require('../../hooks/aggregate');

module.exports = {
  before: {
    all: [],
    find: [
      aggregate()
    ],
    get: [],
    create: [
      localAuth(),
      hashPassword(),
      verifyHooks.addVerification(),
      iff(isProvider('server'), 
        mergeProfile()
      )
    ],
    update: [ disallow('external') ],
    patch: [
      ...restrict,
      iff(
      isProvider('external'),    
      preventChanges([
        'email',
        'isVerified',
        'verifyToken',
        'verifyShortToken',
        'verifyExpires',
        'verifyChanges',
        'resetToken',
        'resetShortToken',
        'resetExpires'
      ]))
    ],
    remove: [ ...restrict ]
  },

  after: {
    all: [
      when(
        hook => hook.params.provider,
        discard('password')
      ),
      populate({ schema: roleSchema }),
      fastJoin(itemResolvers)
    ],
    find: [],
    get: [],
    create: [
      iff(isProvider('external'), 
        context => {
          accountService(context.app).notifier('resendVerifySignup', context.result)
        }
      ),
      verifyHooks.removeVerification()
    ],
    update: [],
    patch: [removeConnecting()],
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
