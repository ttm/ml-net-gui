// Initializes the `coment` service on path `/coment`
const createService = require('feathers-mongoose');
const createModel = require('../../models/coment.model');
const hooks = require('./coment.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/coment', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('coment');

  service.hooks(hooks);
};
