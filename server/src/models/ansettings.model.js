// ansettings-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const ansettings = new Schema({
    name: { type: String, required: true },
    layout: { type: String, required: true },
    network: { type: mongooseClient.Schema.ObjectId, refPath: 'networks' },
    dimensions: { type: Number },
    links: { type: Boolean },
    layers: { type: Number },
    method: { type: Object, required: true },
    separation: { type: Number },
    axis: { type: String }
  }, {
    timestamps: true
  });

  return mongooseClient.model('ansettings', ansettings);
};
