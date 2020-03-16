// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const _ = require('underscore');
const insertInParent = (options, context, i) => {
  const { app, result } = context;
  return new Promise((resolve) => {
    let { childField, parentField, service, isArray, parentObject, object } = options[i];
    let services = options.map(opt => opt.service);
    let go = true;
    let innerFields = service.split('.');
    if (innerFields.length > 1) {
      service = result;
      for (let a = 0; innerFields.length > a; a++) {
        if (innerFields[a] !== 'this') {
          service = service[innerFields[a]];
        }
      }
      go = !services.includes(service);
    }
    if (result[childField] && go) {
      let obj = result._id;
      let parentId = result[childField];
      if (_.isArray(parentId)) parentId = parentId[0];
      if (parentObject) {
        obj = _.mapObject(parentObject, (v, k) => {
          if (v === '_id') return result._id;
          else return parentId[k] || v
        })
      }
      if (object) {
        for (k in object) {
          if (object[k] === '_id') parentId = parentId[k]
        }
      }
      if (typeof parentField === 'object') parentField = parentField[service]
      if (typeof isArray === 'object') isArray = isArray[service]
      if (isArray) {
        return app.service(service).patch(parentId, {$push: {[parentField]: obj}}).then(_ => resolve());
      } else {
        return app.service(service).patch(parentId, {[parentField]: obj}).then(_ => resolve());
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
      promiseArray.push(insertInParent(options, context, i));
    }
    return Promise.all(promiseArray).then((res) => {
      return context;
    })
  };
};
