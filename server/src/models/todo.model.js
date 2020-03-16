// todo-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const todo = new Schema({
    title: { type: String, required: true },
    body: { type: String },
    capa: { type: mongooseClient.Schema.ObjectId, ref: 'foto' },
    user: { type: mongooseClient.Schema.ObjectId, ref: 'users' },
    done: { type: Boolean }
  }, {
    timestamps: true
  });

  return mongooseClient.model('todo', todo);
};
