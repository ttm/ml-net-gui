// Initializes the `uploads` service on path `/uploads`

const AWS = require('aws-sdk');
const Store = require('s3-blob-store');
const multer = require('multer');
const multipartMiddleware = multer();
const dauria = require('dauria');
const { authenticate } = require('@feathersjs/authentication').hooks;

// feathers-blob service
const blobService = require('feathers-blob');
// Here we initialize a FileSystem storage,
// but you can use feathers-blob with any other
// storage service like AWS or Google Drive.

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_S3_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_S3_ACCESS_KEY
});

module.exports = function () {
  const app = this;

  const blobStore = Store({
    client: s3,
    bucket: app.get('bucket')
  });
  
  const bucketUrl = `https://s3-sa-east-1.amazonaws.com/${app.get('bucket')}/`;

  const options = {
    Model: blobStore
  };

  // Initialize our service with any options it requires
  app.use('/uploads',
  
    // multer parses the file named 'uri'.
    // Without extra params the data is
    // temporarely kept in memory
    multipartMiddleware.single('uri'), 
    
    // another middleware, this time to
    // transfer the received file to feathers
    function(req,res,next){
      req.feathers.file = req.file;
      next();
    },
    blobService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('uploads');
  service.hooks({
    before: {
      create: [
        authenticate('jwt'),
        function(hook) {
          hook.params.s3 = { ACL: 'public-read' }; // makes uploaded files public
          if (!hook.data.uri && hook.params.file){
            const file = hook.params.file;
            const uri = dauria.getBase64DataURI(file.buffer, file.mimetype);
            hook.data = {uri: uri};
          }
        }
      ]
    },
    after: {
      create: [
        function(hook) {
          let { service, item, field, type } = hook.data;
          let url = bucketUrl + hook.result.id;
          let { id, size } = hook.result;
          let user = hook.params.user._id;
          if (service !== 'foto') {
            return hook.app.service('foto').create({
              url, 
              sm: url, 
              md: url, 
              lg: url,
              ref: service,
              item,
              user,
              key: id, 
              size,
            }).then((res) => {
              hook.result.img = res;
              if (type === 'single' && field) {
                hook.app.service(service).patch(item, {[field]: res._id}).then(() => {
                  return hook;
                })
              } else {
                return hook;
              }
            })
          } else {
            query = {
              ...query,
              sm: query[field],
              md: query[field],
              lg: query[field],
              key: id, 
              size
            }
            return hook.app.service(service).patch(item, query).then((res) => {
              hook.result.img = res;
              return hook;
            })
          }
        }
      ]
    }
  });
};
