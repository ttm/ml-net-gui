var constants = require('./constants');  // shared values
var network = require('./network');  // shared values

basic = function () {
  return 'Handy  hi!';
}

initialize = function () {
  return 'Handy  initialized!';
}

start_module = module_ => {
  return module_.initialize();
}

basic_from_module = module_ => {
  return module_.basic();
}

start_modules = (modules, init)  => {
  let feedback = {};
  let action = basic_from_module
  if (init === true)
    action = start_module
  for (let i = 0; i < modules.length; i++) {
    feedback[i] = action(modules[i]);
  }
  return feedback
}

start = (modules, init=true) => {
  let feedback = start_modules(modules, init);
  return `Hello World! ${Object.values(feedback).join('\n')} `
}

// basic startup:
basic_start = () => {
  let base_constants = constants.base();
  let start_ = start(base_constants._all_modules);

  let init = start(base_constants._all_modules, false);
  return `${start_}\n|||\n${init}`
}

class Router {
  constructor () {
    this.routes = {};
    this.register_path('/', basic_start);
    this.register_path('/network', network.basic);
    this.register_path('/constants', constants.basic);
  }
  register_path (path_, action_) {
    this.routes[path_] = action_;
  }
  get_path (path) {
    if (path in this.routes) {
      return this.routes[path];
    } else {
      return constants.page_not_found;
    }
  }
}

module.exports = { basic, initialize, basic_start, Router };
