// foto-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const foto = new Schema({
    user: { type: mongooseClient.Schema.ObjectId, ref: 'users' },
    item: { type: mongooseClient.Schema.ObjectId, refPath: 'ref' },
    ref: { type: String },
    url: { type: String, required: true },
    key: { type: String, required: true },
    size: { type: String, required: true },
    title: { type: String },
    text: { type: String },
    sm: { type: String },
    md: { type: String },
    lg: { type: String }
  }, {
    timestamps: true
  });

  return mongooseClient.model('foto', foto);
};
