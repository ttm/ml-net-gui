// endereco-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const endereco = new Schema({
    title: { type: String, default: '', trim: true },
    pais: { type: String, default: '', trim: true },
    estado: { type: String, default: '', trim: true },
    cidade: { type: String, default: '', trim: true },
    rua: { type: String, default: '', trim: true },
    bairro: { type: String, default: '', trim: true },
    numero: { type: String, default: '', trim: true },
    complemento: { type: String, default: '', trim: true },
    cep: { type: String, default: '', trim: true },
    ref: { type: String },
    item: { type: mongooseClient.Schema.ObjectId, refPath: 'ref' },
    local: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }, {
    timestamps: true
  });

  return mongooseClient.model('endereco', endereco);
};
