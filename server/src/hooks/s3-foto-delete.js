// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    const { id, app, path } = context;
    app.service(path).get(id).then((res) => {
      if (res.key) {
        app.service('image-resize').patch(id, res).then((res) => {
          return context;
        })
      } else {
        console.log('no key')
        return context;
      }
    })
  };
};