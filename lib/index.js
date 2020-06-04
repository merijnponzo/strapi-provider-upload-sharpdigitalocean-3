'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const AWS = require('aws-sdk');
const Sharp = require('sharp');

module.exports = {
  init(providerOptions) {
    const S3 = new AWS.S3(providerOptions);

    return {
      upload: file => {
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : '';

          Sharp(file.buffer)
            .toFormat('jpeg')
            .jpeg({ quality: 90, progressive: true })
            .resize(1000, null)
            .toBuffer()
            .then(buffer => {
              var params = {
                Key: `${path}l_${file.hash}.jpeg`,
                Body: new Buffer(buffer, 'binary'),
                ACL: 'public-read',
                ContentType: file.mime
              };

              S3.upload(params, (err, data) => {
                if (err) {
                  return reject(err);
                }
                file.url = data.Location;

                //one more time
                Sharp(buffer)
                  .toFormat('jpeg')
                  .jpeg({ quality: 90, progressive: true })
                  .resize(500, 500)
                  .toBuffer()
                  .then(buffer => {
                    var params = {
                      Key: `${path}t_${file.hash}.jpeg`,
                      Body: new Buffer(buffer, 'binary'),
                      ACL: 'public-read',
                      ContentType: file.mime
                    };

                    S3.upload(params, (err, data) => {
                      if (err) {
                        return reject(err);
                      }
                      file.thumb = data.Location;
                      resolve();
                    });
                  })
                  .catch(err => reject(err));
              });
            })
            .catch(err => reject(err));
        });
      },
      delete: file => {
        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : '';
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });
      }
    };
  }
};
