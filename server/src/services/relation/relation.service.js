// Initializes the `relation` service on path `/relation`
const createService = require('feathers-mongoose');
const createModel = require('../../models/relation.model');
const hooks = require('./relation.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/relation', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('relation');

  service.hooks(hooks);
};
