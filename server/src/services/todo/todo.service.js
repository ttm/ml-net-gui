// Initializes the `todo` service on path `/todo`
const createService = require('feathers-mongoose');
const createModel = require('../../models/todo.model');
const hooks = require('./todo.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/todo', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('todo');

  service.hooks(hooks);
};
