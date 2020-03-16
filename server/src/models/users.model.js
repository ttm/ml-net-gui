// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const slug = require('../utils/makeslug');
  const users = new mongooseClient.Schema({
  
    email: {type: String, unique: true},
    username: { type: String, default: `user-${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15)}` },
    urlized: {type: String, unique: true},
    nome: { type: String },
    telefone: { type: String },
    sobrenome: { type: String },
    password: { type: String },
    roles: [ String ],
    newsLetter: { type: Boolean },
    avatar: { type: mongooseClient.Schema.ObjectId, ref: 'foto' },
    capa: { type: mongooseClient.Schema.ObjectId, ref: 'foto' },
    endereco: { type: mongooseClient.Schema.ObjectId, ref: 'endereco' },
    profile: { type: Object },

    isVerified: { type: Boolean },
    verifyToken: { type: String },
    verifyShortToken: { type: String },
    verifyExpires: { type: Date },
    verifyChanges: { type: Object },
    resetToken: { type: String },
    resetShortToken: { type: String },
    resetExpires: { type: Date }, 
  
    connectingAccounts: { type: Boolean },
    localAuth: { type: Boolean },
  
    googleId: { type: String },
    google: { type: Object },
  
    facebookId: { type: String },
    facebook: { type: Object },
  
    githubId: { type: String },
    github: { type: Object },

  }, {
    timestamps: true
  });

  users.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('username')) { return next(); }
    this.urlized = slug.format(this.username);
    next();
  });

  return mongooseClient.model('users', users);
};
