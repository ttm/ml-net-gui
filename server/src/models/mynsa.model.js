// mynsa-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const mynsa = new Schema({
    // do communicability Set/2019
    serverdurations: { type: Object },
    cliserduration: { type: Number },
    plotduration: { type: Number },
    subtotaldur: { type: Number },
    totaldur: { type: Number },

    // new for MyNSA
    timeslot: { type: Number },
    mtype: { type: String },
    mmount: { type: Boolean },

    // timing statup tasks
    mcreatedt: { type: Number },
    mstartt: { type: Number },
    mrequestt: { type: Number },
    mdatat: { type: Number },
    minfot: { type: Number },
    mvmapt: { type: Number },
  }, {
    timestamps: true
  });

  return mongooseClient.model('mynsa', mynsa);
};
