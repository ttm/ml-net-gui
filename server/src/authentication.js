const authentication = require('@feathersjs/authentication');
const jwt = require('@feathersjs/authentication-jwt');
const local = require('@feathersjs/authentication-local');
const oauth2 = require('@feathersjs/authentication-oauth2');
const GoogleStrategy = require('passport-google-oauth20');
const FacebookStrategy = require('passport-facebook');
const GithubStrategy = require('passport-github');
const makeHandler = require('./oauth-handler');
const Verifier = oauth2.Verifier;

module.exports = function (app) {

  class CustomVerifier extends Verifier {

    _updateEntity (entity, data) {
      const options = this.options;
      const name = options.name;
      const id = entity[this.service.id];
  
      const newData = {
        [options.idField]: data.profile.id,
        [name]: data
      };
  
      return this.service.patch(id, newData, { oauth: { provider: name } });
    }

    _createEntity (data) {
      const options = this.options;
      const name = options.name;
      const entity = {
        [options.idField]: data.profile.id,
        [name]: data
      };
  
      const id = entity[options.idField];
  
      return this.service.create(entity, { oauth: { provider: name } });
    }

    async verify (req, accessToken, refreshToken, profile, done) {
      const options = this.options;
      const query = {
        [options.idField]: profile.id, // facebookId: profile.id
        $limit: 1
      };
      const data = { profile, accessToken, refreshToken };
      let existing;
  
      if (this.service.id === null || this.service.id === undefined) {
        return done(new Error('the `id` property must be set on the entity service for authentication'));
      }
  
      // Check request object for an existing entity
      if (req && req[options.entity]) {
        existing = req[options.entity];
      }
  
      // Check the request that came from a hook for an existing entity
      if (!existing && req && req.params && req.params[options.entity]) {
        existing = req.params[options.entity];
      }
      let userQuery = {githubId: profile.id};
      if (profile.emails) {
        userQuery = {email: profile.emails[0].value};
      }
      if (!existing) {
        let checkUser = await this.app.service('users').find({query: userQuery});
        if (checkUser.total > 0) {
          let user = checkUser.data[0];
          if (!user[`${profile.provider}Id`] && user.connectingAccounts) {
            existing = user;
          } else if (user[`${profile.provider}Id`] && !user.connectingAccounts) {
            existing = undefined;
          } else {
            const redirectUrl = this.app.settings.authentication[profile.provider].failureRedirect;
            let providers = [];
            if (user.facebookId) {
              providers.push('Facebook')
            } 
            if (user.githubId) {
              providers.push('Github')
            } 
            if (user.googleId) {
              providers.push('Google')
            } 
            if (user.localAuth) {
              providers.push('Email e Senha')
            }
            let message = `Esse email já está sendo usado em uma conta. Faça login por: ${providers.join(' / ')}.`
            return req.res.redirect(`${redirectUrl}?message=${message}`)
          }
        }
      }
  
      // If there is already an entity on the request object (ie. they are
      // already authenticated) attach the profile to the existing entity
      // because they are likely "linking" social accounts/profiles.
      if (existing) {
        return this._updateEntity(existing, data)
          .then(entity => done(null, entity))
          .catch(error => error ? done(error) : done(null, error));
      }

      // Find or create the user since they could have signed up via facebook.
      this.service
        .find({ query })
        .then(this._normalizeResult)
        .then(entity => entity ? this._updateEntity(entity, data) : this._createEntity(data))
        .then(entity => {
          const id = entity[this.service.id];
          const payload = { [`${this.options.entity}Id`]: id };
          done(null, entity, payload);
        })
        .catch(error => error ? done(error) : done(null, error));
    }
  }
  const config = app.get('authentication');

  // Create a handler by passing the `app` object.
  const handler = makeHandler(app);

  // Set up authentication with the secret
  app.configure(authentication(config));
  app.configure(jwt());
  app.configure(local());

  app.configure(oauth2(Object.assign({
    name: 'google',
    Strategy: GoogleStrategy,
    handler: handler(config.facebook.successRedirect, 'google'),
    Verifier: CustomVerifier
  }, config.google)));

  app.configure(oauth2(Object.assign({
    name: 'facebook',
    Strategy: FacebookStrategy,
    handler: handler(config.facebook.successRedirect, 'facebook'),
    Verifier: CustomVerifier
  }, config.facebook)));

  app.configure(oauth2(Object.assign({
    name: 'github',
    Strategy: GithubStrategy,
    handler: handler(config.facebook.successRedirect, 'github'),
    Verifier: CustomVerifier
  }, config.github)));

  // The `authentication` service is used to create a JWT.
  // The before `create` hook registers strategies that can be used
  // to create a new valid JWT (e.g. local or oauth2)
  app.service('authentication').hooks({
    before: {
      create: [
        authentication.hooks.authenticate(config.strategies)
      ],
      remove: [
        authentication.hooks.authenticate('jwt')
      ]
    }
  });
};
