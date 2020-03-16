// Initializes the `mynsa` service on path `/mynsa`
const createService = require('feathers-mongoose');
const createModel = require('../../models/mynsa.model');
const hooks = require('./mynsa.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/mynsa', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('mynsa');

  service.hooks(hooks);
};
