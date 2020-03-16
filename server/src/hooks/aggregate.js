// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const { ObjectId } = require('mongodb');
const _ = require('underscore');

const replaceIds = function (obj) {
  const keys = Object.keys(obj);
    for (var i = 0; keys.length > i; i++) {
      let key = keys[i];
      let val = obj[key];
      if (_.isArray(val)) {
        for (var o = 0; val.length > o; o++) {
          if (_.isObject(val[o])) val[o] = replaceIds(val[o]);
          else if (ObjectId.isValid(val[o])) val[o] = ObjectId(val[o]);
        }
      } else if (_.isObject(val)) {
        val = replaceIds(val);
      } else if (ObjectId.isValid(val)) {
        val = ObjectId(val);
      }
    }
    return obj;
}
// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    if('_aggregate' in context.params.query) {
      let aggregate = context.params.query._aggregate;
      let macthes = _.filter(aggregate, (match) => {
        return match.hasOwnProperty('$match');
      })
      if (macthes.length > 0) {
        for (var i = 0; macthes.length > i; i++) {
          let index = _.findIndex(aggregate, (match) => {
            return _.isEqual(macthes[i], match)
          })
          aggregate[index].$match = replaceIds(macthes[i].$match);
        }
      }
      context.result = context.service.Model.aggregate(aggregate);
    }
    return context;
  };
};
