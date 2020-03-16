// coment-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const coment = new Schema({
    text: { type: String, required: true },
    ref: { type: String },
    item: { type: mongooseClient.Schema.ObjectId, refPath: 'ref' },
    user: { type: mongooseClient.Schema.ObjectId, ref: 'users' },
    answer: { type: mongooseClient.Schema.ObjectId, ref: 'coment' },
    foto: { type: mongooseClient.Schema.ObjectId, ref: 'foto' },
  }, {
    timestamps: true
  });

  return mongooseClient.model('coment', coment);
};
