// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
const _ = require('underscore');
const removeFromParent = (options, context, i) => {
  const { app, result, id } = context;
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
      if (!_.isArray(parentId)) parentId = [parentId];
      if (parentObject) {
        obj = _.mapObject(parentObject, (v, k) => {
          if (v === '_id') return result._id;
        })
        for (k in obj) {
          if (!obj[k]) delete obj[k]
        }
      }
      if (object) {
        for (k in object) {
          if (object[k] === '_id') parentId = parentId.map(p => p[k]);
        }
      }
      if (typeof parentField === 'object') parentField = parentField[service]
      if (typeof isArray === 'object') isArray = isArray[service]
      if (isArray) {
        console.log(`{$pull: {${parentField}: ${obj}}}`)
        console.log(obj)
        console.log(parentId)
        return app.service(service).patch(null, {$pull: {[parentField]: obj}}, {query: {_id: { $in: parentId}}}).then(_ => resolve())
      } else {
        return app.service(service).patch(null, {[parentField]: null}, {query: {_id: { $in: parentId}}}).then(_ => resolve())
      }
    } else {
      return resolve();
    }
  })
}
module.exports = function (options = {}) {
  return context => {
    const promiseArray = [];
    for (var i = 0; options.length > i; i++) {
      promiseArray.push(removeFromParent(options, context, i));
    }
    return Promise.all(promiseArray).then((res) => {
      return context;
    })
  };
};
