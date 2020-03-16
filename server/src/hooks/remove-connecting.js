// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const removeConnectinAccounts = (context, data) => {
  if (context.result.connectingAccounts) {
    context.app.service('users').patch(context.result._id, {connectingAccounts: undefined}).then(() => {
      return context;
    })
  } else {
    return context;
  }
}
// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    const data = context.data
    if (data.facebookId) {
      return removeConnectinAccounts(context, data)
    } else if (data.googleId) {
      return removeConnectinAccounts(context, data)
    } else if (data.githubId) {
      return removeConnectinAccounts(context, data)
    } else {
      return context;
    }
  };
};
