// Initializes the `checkemail` service on path `/checkemail`
const hooks = require('./checkemail.hooks');

module.exports = function (app) {
  const users = app.service('users')
  // Initialize our service with any options it requires
  app.use('/checkemail', {
    create (data) {
      return new Promise((resolve, reject) => {
        users.find({query: {email: data.email}}).then((res) => {
          const user = res.total === 1 ? { username: res.data[0].username, profile: res.data[0].profile, isVerified: res.data[0].isVerified, hasPassword: !!res.data[0].password } : false;
          resolve(user);
        }).catch((err) => {
          reject(err);
        })
      })
    },
    patch (id, data) {
      return new Promise((resolve, reject) => {
        users.find({query: {_id: id}}).then((res) => {
          let user = res.data[0];
          if (!user.connectingAccounts) {
            reject(new Error('Error'))
          }
          users.find({query: {_id: data.id}}).then((res) => {
            const newUser = res.data[0];
            let updateData = {};
            updateData[`${data.provider}Id`] = newUser[`${data.provider}Id`]
            updateData[data.provider] = newUser[data.provider]
            users.patch(user._id, updateData).then((user) => {
              users.remove(newUser._id).then((res) => {
                resolve(user);
              }).catch((err) => {
                reject(err);
              })
            })
          }).catch((err) => {
            reject(err);
          })
        }).catch((err) => {
          reject(err);
        })
      })
    }
  });

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('checkemail');

  service.hooks(hooks);
};
