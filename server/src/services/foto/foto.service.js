// Initializes the `foto` service on path `/foto`
const createService = require('feathers-mongoose');
const createModel = require('../../models/foto.model');
const hooks = require('./foto.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/foto', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('foto');

  service.hooks(hooks);
};
