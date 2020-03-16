/* eslint-disable no-unused-vars */
const gm = require('gm');
const mime = require('mime');
const request = require('request');
const sizes =  [
  {key: 'sm', width: 50 }, 
  {key: 'md', width: 200 }, 
  {key: 'lg', width: 500 }
];

class Service {
  constructor (options, app, s3, bucketUrl) {
    this.options = options || {};
    this.app = app;
    this.s3 = s3;
    this.bucketUrl = bucketUrl;
  }

  async find (params) {
    return [];
  }

  async get (id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create (data, params) {
    return new Promise((resolve, reject) => {
      const { fotoId } = data;
      this.app.service('foto').get(fotoId).then((res) => {
        const fotoKey = res.key;
        for (var i = 0; sizes.length > i; i++) {
          const size = sizes[i];
          gm(request(res.url), `${size.key}-${fotoKey}`)
            .resize(size.width)
            .stream((err, stdout, stderr) => {
              var buf = new Buffer('');
              stdout.on('data', (data) => {
                buf = Buffer.concat([buf, data]);
              });
              stdout.on('end', (data) => {
                var data = {
                  Bucket: this.app.get('bucket'),
                  Key: `${size.key}-${fotoKey}`,
                  Body: buf,
                  ContentType: mime.getType(`${size.key}-${fotoKey}`),
                  ACL: 'public-read'
                };
                this.s3.putObject(data, (err, res) => {
                  if (!err) {
                    this.app.service('foto').patch(fotoId, {[size.key]: this.bucketUrl + `${size.key}-${fotoKey}`}).catch(err => console.log('err'))
                  } else {
                    console.log('err');
                  }
                });
              });
            })
        }
      })
    })
  }

  async update (id, data, params) {
    return data;
  }

  async patch (id, data, params) {
    const s3Params = {
      Bucket: this.app.get('bucket'),
      Delete: {
        Objects: [{
          Key: data.key
        }],
        Quiet: false
      }
    }
    for (var i = 0; sizes.length > i; i++) {
      s3Params.Delete.Objects.push({ Key: `${sizes[i].key}-${data.key}` })
    }
    this.s3.deleteObjects(s3Params, (err, data) => {
      if (err) {
        console.log('err', 'err.stack');
      } else {
        console.log('data');
        return data;
      }
    });
  }

  async remove (id, params) {
    return { id };
  }
}

module.exports = function (options, app, s3, bucketUrl) {
  return new Service(options, app, s3, bucketUrl);
};

module.exports.Service = Service;
