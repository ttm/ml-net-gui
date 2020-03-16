// layouts-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const layouts = new Schema({
    // should represent a dictionary with { node_id: position (x, y, z) } as { key: value }
    data: { type: String, required: true },
    layout_name: { type: String, required: true },
    dimensions: { type: Number, required: true },
    network: { type: mongooseClient.Schema.ObjectId, ref: 'networks' }
  }, {
    timestamps: true
  });

  return mongooseClient.model('layouts', layouts);
};
