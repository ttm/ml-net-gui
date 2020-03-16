// networks-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const slug = require('../utils/makeslug');
  const { Schema } = mongooseClient;
  const networks = new Schema({
    data: { type: String, required: true }, // nodes and links
    layer: { type: Number, required: true }, // 0 for uncoarsened network
    coarsen_method: { type: String, required: true }, // meaningless if layer == 0
    uncoarsened_network: { type: mongooseClient.Schema.ObjectId, refPath: 'networks' },
    description: { type: String },
    title: { type: String },
    user: { type: mongooseClient.Schema.ObjectId, ref: 'users' },
    filename: { type: String, required: true},
    urlized: { type: String }
  }, {
    timestamps: true
  });

  networks.pre('save', function save(next) {
    if (!this.slug) {
      this.urlized = slug.format(this.filename) + Math.random().toString(36).replace(/[^a-z]+/g, '');
    }
    if (!this.uncoarsened_network) {
      this.uncoarsened_network = this._id;
    }
    next();
  });

  return mongooseClient.model('networks', networks);
};
