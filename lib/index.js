'use strict';

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const { VodUploadClient, VodUploadRequest } = require('./vod-node-sdk');

const trimParam = str => (typeof str === 'string' ? str.trim() : undefined);

module.exports = {
  provider: 'tencentcloud',
  name: 'Tencent Cloud',
  auth: {
    public: {
      label: 'Cloud API Key ID',
      type: 'text',
    },
    private: {
      label: 'Cloud API Key',
      type: 'text',
    },
    region: {
      label: 'Region',
      type: 'enum',
      values: [
        'ap-beijing',
        'ap-chengdu',
        'ap-chongqing',
        'ap-guangzhou',
        'ap-guangzhou-open',
        'ap-hongkong',
        'ap-seoul',
        'ap-shanghai',
        'ap-singapore',
        'eu-frankfurt',
        'na-siliconvalley',
        'na-toronto',
        'ap-mumbai',
        'na-ashburn',
        'ap-bangkok',
        'eu-moscow',
        "ap-tokyo",
      ],
    },
  },
  init: config => {
    const client = new VodUploadClient(trimParam(config.public), trimParam(config.private));
    return {
      upload: file => {
        return new Promise((resolve, reject) => {

          console.log(file);

          let req = new VodUploadRequest();
          req.MediaFilePath = file.tmpPath;
          req.MediaName = file.name;
          req.MediaType = "MP4";
          // mime: 'video/mp4',
          // mime: 'video/quicktime',
          client.upload(trimParam(config.region), req, function (err, data) {
            if (err) {
              return reject(err);
            }

            // console.log(data);
            // console.log(data.FileId);
            // console.log(data.MediaUrl);
            // console.log(data.CoverUrl);

            file.url = data.MediaUrl;
            file.provider_metadata = {
              fileFd: data.FileId,
              mediaUrl: data.MediaUrl,
              coverUrl: data.CoverUrl,
            };
            resolve();
          });
        });
      },
      delete: file => {
        return new Promise((resolve, reject) => {
          // console.log(file);
          // file.url

          const tencentcloud = require("tencentcloud-sdk-nodejs");
          const VodClient = tencentcloud.vod.v20180717.Client;
          const models = tencentcloud.vod.v20180717.Models;

          const Credential = tencentcloud.common.Credential;
          const ClientProfile = tencentcloud.common.ClientProfile;
          const HttpProfile = tencentcloud.common.HttpProfile;

          let cred = new Credential(trimParam(config.public), trimParam(config.private));
          let httpProfile = new HttpProfile();
          httpProfile.endpoint = "vod.tencentcloudapi.com";
          let clientProfile = new ClientProfile();
          clientProfile.httpProfile = httpProfile;
          let client = new VodClient(cred, trimParam(config.region), clientProfile);

          let req = new models.DeleteMediaRequest();

          try {
            const { fileFd } = file.provider_metadata;
            let params = `{ "FileId" : "${fileFd}" }`;
            req.from_json_string(params);
          } catch (error) {
            return reject(error.error);
          }

          client.DeleteMedia(req, function(err, response) {
            if (err) {
              return reject(err);
            }

            console.log(response.to_json_string());
            resolve();
          });
        });
      },
    };
  },
};
