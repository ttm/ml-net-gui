// usage-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const usage = new Schema({
    file: { type: mongooseClient.Schema.ObjectId, ref: 'network' },
    filename: { type: String, required: true},
    dimredmet: { type: String, required: true},
    dimredmetL: { type: String, required: true},
    clustmet: { type: String, required: true},
    temp: { type: Number, required: true },
    mangle: { type: Number, required: true },
    cdim: { type: Number, required: true },
    dimensions: { type: Number, required: true },
    nnodes: { type: Number, required: true },
    nc: { type: [Number], required: true },
    serverdurations: { type: Object },
    cliserduration: { type: Number },
    plotduration: { type: Number },
    subtotaldur: { type: Number },
    totaldur: { type: Number },
  }, {
    timestamps: true
  });
  return mongooseClient.model('usage', usage);
};
