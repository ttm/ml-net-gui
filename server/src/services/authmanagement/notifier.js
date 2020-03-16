module.exports = function(app) {

  const apiUrl = app.get('apiUrl')

  function getLink(type, hash) {
    const url = apiUrl + '/' + type + '?token=' + hash
    return url
  }

  function sendEmail(email) {
    return app.service('mailer').create(email).then(function (result) {
      console.log('Sent email', result)
    }).catch(err => {
      console.log('Error sending email', err)
    })
  }

  return {
    notifier: function(type, user, notifierOptions) {
      let tokenLink
      let email
      switch (type) {
        case 'resendVerifySignup': //sending the user the verification email
          tokenLink = getLink('verify', user.verifyToken)
          email = {
             from: process.env.FROM_EMAIL,
             to: user.email,
             subject: 'Verify Signup',
             html: tokenLink
          }
          return sendEmail(email)
          break

        case 'verifySignup': // confirming verification
          tokenLink = getLink('verify', user.verifyToken)
          email = {
             from: process.env.FROM_EMAIL,
             to: user.email,
             subject: 'Confirm Signup',
             html: 'Thanks for verifying your email'
          }
          return sendEmail(email)
          break

        case 'sendResetPwd':
          tokenLink = getLink('reset', user.resetToken)
          email = {
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'Reset password',
            html: tokenLink
         }
          return sendEmail(email)
          break

        case 'resetPwd':
          tokenLink = getLink('reset', user.resetToken)
          email = {
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'Password reseted',
            html: tokenLink
         }
          return sendEmail(email)
          break

        case 'passwordChange':
          email = {
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'Password changed',
            html: tokenLink
         }
          return sendEmail(email)
          break

        case 'identityChange':
          tokenLink = getLink('verifyChanges', user.verifyToken)
          email = {
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: 'identity Change',
            html: tokenLink
         }
          return sendEmail(email)
          break

        default:
          break
      }
    }
  }
}