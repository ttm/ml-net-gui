// Initializes the `networks` service on path `/networks`
const createService = require('feathers-mongoose');
const createModel = require('../../models/networks.model');
const hooks = require('./networks.hooks');

module.exports = function (app) {
  const Model = createModel(app);

  const options = {
    Model,
  };

  // Initialize our service with any options it requires
  app.use('/networks', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('networks');

  service.hooks(hooks);
};
