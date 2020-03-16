// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars

module.exports = function (options = {}) {
  return async context => {
    const slug = require('../utils/makeslug')
    let profile
    // console.log(context.data);
    if (context.data.facebook) {
      profile = context.data.facebook.profile
      profile = {
        email: profile.emails[0].value,
        username: profile.username || slug.format(profile.displayName),
        nome: profile.name.givenName,
        sobrenome: profile.name.familyName,
        facebookId: profile.id,
        profile: {
          picture: profile.photos[0].value,
          gender: profile.gender,
          facebookLink: profile.profileUrl
        },
        isVerified: true
      }
    } else if (context.data.google) {
      profile = context.data.google.profile
      profile = {
        email: profile.emails[0].value,
        username: slug.format(profile.displayName),
        nome: profile._json.name.givenName,
        sobrenome: profile._json.name.familyName,
        googleId: profile.id,
        profile: {
          picture: profile._json.image.url,
          gender: profile.gender,
          googleLink: profile._json.url
        },
        isVerified: true
      }
    }
    context.data = { ...context.data, ...profile }
    return context;
  };
};
