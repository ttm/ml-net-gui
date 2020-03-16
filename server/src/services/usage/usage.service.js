// Initializes the `usage` service on path `/usage`
const createService = require('feathers-mongoose');
const createModel = require('../../models/usage.model');
const hooks = require('./usage.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/usage', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('usage');

  service.hooks(hooks);
};
