// feedback-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const feedback = new Schema({
    type: { type: String, required: true },
    user: { type: mongooseClient.Schema.ObjectId, ref: 'users' },
    ref: { type: String, required: true },
    item: { type: mongooseClient.Schema.ObjectId, refPath: 'ref', required: true },
  }, {
    timestamps: true
  });

  return mongooseClient.model('feedback', feedback);
};
