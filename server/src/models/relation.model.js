// relation-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const relation = new Schema({
    act: { type: mongooseClient.Schema.ObjectId, refPath: 'actref' },
    recept: { type: mongooseClient.Schema.ObjectId, refPath: 'recref' },
    type: { type: String },
    actref: { type: String },
    recref: { type: String },
    data: { type: Object }
  }, {
    timestamps: true
  });

  return mongooseClient.model('relation', relation);
};
