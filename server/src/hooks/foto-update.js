// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    const { data, result, app } = context;
    if (data.url) {
      app.service('image-resize').create({fotoId: result._id})
    }
    return context;
  };
};
