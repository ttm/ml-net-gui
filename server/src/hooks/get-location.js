// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDJWx1QxrFgQPPuMJsSWCyKl51ImQOocIA',
  Promise: Promise
});

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    return googleMapsClient.geocode({address: `${context.data.numero} ${context.data.rua}, ${context.data.cidade}, ${context.data.estado}`})
    .asPromise()
    .then((res) => {
      context.data.local = {
        lat: res.json.results[0].geometry.location.lat,
        lng: res.json.results[0].geometry.location.lng
      }
      return context;
    })
    .catch((err) => {
      throw new Error(err);
    });
  };
};
