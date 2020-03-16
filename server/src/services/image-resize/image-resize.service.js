// Initializes the `image-resize` service on path `/image-resize`
const AWS = require('aws-sdk');
const createService = require('./image-resize.class.js');
const hooks = require('./image-resize.hooks');

module.exports = function (app) {

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_S3_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_S3_ACCESS_KEY,
    bucket: app.get('bucket')
  });
  
  const bucketUrl = `https://s3-sa-east-1.amazonaws.com/${app.get('bucket')}/`;
  
  const paginate = app.get('paginate');

  const options = {
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/image-resize', createService(options, app, s3, bucketUrl));

  // Get our initialized service so that we can register hooks
  const service = app.service('image-resize');

  service.hooks(hooks);
};
