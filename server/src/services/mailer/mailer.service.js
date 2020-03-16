// Initializes the `mailer` service on path `/mailer`
const hooks = require('./mailer.hooks');
const Mailer = require('feathers-mailer');
const smtpTransport = require('nodemailer-smtp-transport');

module.exports = function () {
  const app = this;

  // Initialize our service with any options it requires
  app.use('/mailer', Mailer(smtpTransport({
    service: 'ses',
    host: 'email-smtp.us-east-1.amazonaws.com',
    auth: {
      user: process.env.AWS_SES_USER_NAME,
      pass: process.env.AWS_SES_PASSWORD
    }
  })));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('mailer');

  service.hooks(hooks);
};
