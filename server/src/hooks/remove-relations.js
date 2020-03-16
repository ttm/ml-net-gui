// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return context => {
    const { app, result, service } = context;
    let query = {query: {item: result._id, ref: service.Model.modelName}}
    query = {query: {$or: [{act: result._id}, {recept: reslt._id}]}}
    return app.service('relation').remove(null, query).then(() => {
      return context;
    })
  };
};
