// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const removeItem = (service, field, app) => {
  return new Promise((resolve) => {
    app.service(service).remove(field).then(_ => resolve())
  })
}
const removePopulation = (options, context, i) => {
  const { app, result } = context;
  return new Promise((resolve) => {
    const population = options[i];
    if (result[population.field]) {
      if (result[population.field].length !== 0) {
        if (result[population.field].length) {
          const itemArray = [];
          for (var o = 0; result[population.field].length > o; o++) {
            itemArray.push(removeItem(population.service, result[population.field][o], app));
          }
          return Promise.all(itemArray).then((res) => {
            return resolve();
          })
        } else {
          return app.service(population.service).remove(result[population.field]).then(_ => resolve());
        }
      } else {
        return resolve();
      }
    } else {
      return resolve();
    }
  })
}
// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return context => {
    const promiseArray = [];
    for (var i = 0; options.length > i; i++) {
      promiseArray.push(removePopulation(options, context, i));
    }
    return Promise.all(promiseArray).then((res) => {
      return context;
    })
  };
};
