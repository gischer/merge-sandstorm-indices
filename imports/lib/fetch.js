//import { HTTPS } from 'https';
import AXIOS from 'axios';
import { promises as FSP } from 'fs';
import R from 'ramda';

import { Config } from '/imports/startup/both/config';
import { Files, setStatus } from '/imports/api/files';
import { updateProgress, processMetadata } from '/imports/api/mainIndex';
import { CanonicalSource } from '/imports/api/sources';
import { storeStreamTo, storeBufferTo } from '/imports/lib/store';
import { ASSET_READY, ASSET_HAS_ERRORS, ASSET_IN_PROGRESS } from  '/imports/lib/crunchAppStatus';


var AppIndexInstance = null;
const PhonyBaseURL = 'http://192.168.0.42/';

const urlRegex = /([a-z0-9]+):\/\/([a-z0-9\.]+):([\d]+)/;

export function createHttpInstance(source, sandstormInfo) {
  if (Meteor.isServer) {
    const proxyParsed = process.env.HTTP_PROXY.match(urlRegex)
    const axiosInstance = AXIOS.create({
      /*
      proxy: {
        protocol: proxyParsed[1],
        host: proxyParsed[2],
        port: Number(proxyParsed[3]),
      },
      */
      baseURL: PhonyBaseURL,
      timeout: 0,
      responseType: 'stream',
      headers: {
        'Authorization': `Bearer ${source.accessToken}`,
      }
    })
    return axiosInstance;
  } else {
    return {
      get(filename) {
        return Promise.resolve(true)
      }
    }
  }
};


export function fetchAndStorePackage(app) {
  const packageFile = Files.findOne({appId: app._id, sourceId: app.sourceId, type: 'package'})
  setStatus(packageFile, 'Fetching');
  return new Promise((resolve, reject) => {
    app.fetcher.get(packageFile.path)
    .then((response) => {
      if (!response) {
        const message = `Package fetch had no response`
        console.log(message);
        reject(new Error(message));
      }
      if (app.fetcher.defaults.responseType === 'stream') {
        setStatus(packageFile, ASSET_IN_PROGRESS);
        storeStreamTo(response.data, packageFile.path)
        .on('finish', Meteor.bindEnvironment(() => {
          setStatus(packageFile, ASSET_READY);
          resolve(true);
        }))
        .on('error', Meteor.bindEnvironment((error) => {
          const message = `Error storing package: ${error}`
          setStatus(packageFile, ASSET_HAS_ERRORS, error );
          console.log(message);
          reject(new Error(message))
        }))
      } else {
        setStatus(packageFile, ASSET_IN_PROGRESS);
        storeBufferTo(response.data, Config.localFileRoot + packageFile.path)
        .then(() => {
          setStatus(packageFile, ASSET_READY);
          resolve(true);
        });
      }
    })
    .catch((err) => {
      const message = `Error fetching package for ${app.name}: ${err}`;
      console.log(message)
      setStatus(packageFile, ASSET_HAS_ERRORS, err.toString());
      reject(new Error(message));
    })
  })
};

export function fetchAndStoreMetadata(app) {
  const metadataFile = Files.findOne({appId: app._id, sourceId: app.sourceId, type: 'metadata'});
  setStatus(metadataFile, 'Fetching');
  return new Promise((resolve, reject) => {
    app.fetcher.get(metadataFile.path).then((response) => {
      if (!response) {
        const message = `Package fetch had no response`;
        console.log(message);
        reject(new Error(message));
      }
      if (app.fetcher.defaults.responseType === 'stream') {
        storeStreamTo(response.data, metadataFile.path)
          .on('finish', Meteor.bindEnvironment(() => {
            setStatus(metadataFile, ASSET_READY);
            resolve(true);
          }))
          .on('error', Meteor.bindEnvironment((error) => {
            const message = `Error storing metadata: ${error}`;
            console.log(message);
            reject(new Error(message))
          }));
      } else {
        setStatus(metadataFile, ASSET_IN_PROGRESS);
        storeBufferTo(JSON.stringify(response.data), Config.localFileRoot + metadataFile.path)
        .then(() => {
          setStatus(metadataFile, ASSET_READY);
          resolve(true);
        });
      }
    })
    .catch((err) => {
      setStatus(metadataFile, ASSET_HAS_ERRORS, err.toString())
      const message = `Error fetching metadata: ${err}`;
      reject(new Error(message));
    })
  })
};


export function fetchAndStoreImage(app, imageFile) {
  setStatus(imageFile, 'Fetching');
  return new Promise((resolve, reject) => {
    app.fetcher.get(imageFile.path).then((response) => {
      if (!response) {
        const message = `Image fetch had no response`;
        console.log(message);
        reject(new Error(message));
      }
      setStatus(imageFile, ASSET_IN_PROGRESS);
      if (app.fetcher.defaults.responseType === 'stream') {
        storeStreamTo(response.data, imageFile.path)
        .on('finish', Meteor.bindEnvironment(() => {
          setStatus(imageFile, ASSET_READY);
          resolve(true);
        }))
        .on('error', Meteor.bindEnvironment((error) => {
          const message = `Error storing image: ${error}`;
          console.log(message);
          setStatus(imageFile, ASSET_HAS_ERRORS, error);
          reject(new Error(message));
        }));
      } else {
        storeBufferTo(response.data, imageFile.path)
        .then(() => {
          setStatus(imageFile, ASSET_READY);
          resolve(true);
        });
      }
    })
    .catch((err) => {
      setStatus(imageFile, ASSET_HAS_ERRORS, err.toString())
      const message = `Error fetching image: ${err}`;
      console.log(message);
      reject(new Error(message));
    })
  })
};

export function fetchAndStoreImages(app) {
  return new Promise((resolve, reject) => {
    processMetadata(app)
    .then((metadata) => {
      const files = Files.find({appId: app._id, sourceId: app.sourceId, type: 'image'}).fetch();

      function getScreenshot(promise, file) {
        console.log(`fetching ${file}`)
        return new Promise((resolve, reject) => {
          promise.then((result) => {
            setStatus(file, 'Fetching')
            return app.fetcher.get(file.path);
          }).then((response) => {

            setStatus(file, ASSET_IN_PROGRESS);
            if (app.fetcher.defaults.responseType === 'stream') {
              storeStreamTo(response.data, file.path)
              .on('finish', Meteor.bindEnvironment(() => {
                setStatus(file, ASSET_READY);
                resolve(true);
              }))
            } else {
              storeBufferTo(response.data, Config.localFileRoot + file.path)
              .then(() => {
                setStatus(file, ASSET_READY);
                resolve(true);
              });
            }
          })
          .catch((err) => {
            setStatus(file, ASSET_HAS_ERRORS, err.toString());
          })
        })
      }
      const result = R.reduce(getScreenshot, Promise.resolve(true), files);
      result.then(() => {
        resolve(true);
      });
    });
  })
};

export function fetchAllParts(app, sandstormInfo) {
  const source = app.source;

  // Create fetcher 
  app.fetcher = createHttpInstance(source, sandstormInfo);

  // Add files for this app into the Files collection
  Files.insert({appId: app._id, sourceId: app.sourceId, appVersionNumber: app.versionNumber, type: 'package', path: `/packages/${app.packageId}`, status: 'Absent', errmsg: ""});
  Files.insert({appId: app._id, sourceId: app.sourceId, appVersionNumber: app.versionNumber, type: 'metadata', path: `/apps/${app.appId}.json`, status: 'Absent', errmsg: ""});
  if (app.imageId) {
    Files.insert({appId: app._id, sourceId: app.sourceId, type: 'image', path: `/images/${app.imageId}`, status: 'Absent', errmsg: ""})
  };

  const mFiles = Files.find({type: 'metadata'}).fetch();
  R.map((file) => {console.log(file)}, mFiles);

  fetchAndStorePackage(app).then(() => {
    fetchAndStoreMetadata(app)
    .then(() => {
      fetchAndStoreImages(app)
      .then(() => {
        updateProgress(app);
      })
    })
  })
  .catch((err) => {
    console.log(err);
  })

}
