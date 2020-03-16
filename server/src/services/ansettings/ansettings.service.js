// Initializes the `ansettings` service on path `/ansettings`
const createService = require('feathers-mongoose');
const createModel = require('../../models/ansettings.model');
const hooks = require('./ansettings.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/ansettings', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('ansettings');

  service.hooks(hooks);
};
