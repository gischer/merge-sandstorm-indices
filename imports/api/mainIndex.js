import { Mongo } from 'meteor/mongo';

import R from 'ramda';

import { Config } from '/imports/startup/both/config';
import { Files } from '/imports/api/files';
import { Sources } from '/imports/api/sources';
import { SandstormInfo } from '/imports/api/sandstorm';
import { crunchAppStatus, ASSET_READY, ASSET_HAS_ERRORS } from '/imports/lib/crunchAppStatus';
import { selectIncludedApps } from '/imports/lib/selectIncludedApps';
import { fetchAllParts } from '/imports/lib/fetch';
import { setActiveDir, readFileAsString } from '/imports/lib/store';



export const MainIndex = new Mongo.Collection('index');

const IndexInProgress = {
  dirname: "default",
  appsToInclude: [],
  appsToUpdate: [],
  appsToCopy: [],
  appsReady: [],
}

export function initializeUpdate() {
  const d = new Date();
  IndexInProgress.dirname = R.replace(/[T:]/g, '-', R.split('.', d.toISOString())[0]);
  IndexInProgress.appsToInclude = [];
  IndexInProgress.appsToUpdate = [];
  IndexInProgress.appsToCopy = [];
  IndexInProgress.appsReady = [];
  IndexInProgress.appsWithErrors = [];
  setActiveDir(IndexInProgress.dirname);
}

export function updateProgress(app) {
  // Calculate app status
  const status = crunchAppStatus(app);

  function idApp(anApp) {
    return (anApp._id == app._id);
  }

  if (status == ASSET_READY) {
    IndexInProgress.appsToUpdate = R.reject(idApp, IndexInProgress.appsToUpdate);
    IndexInProgress.appsToCopy = R.reject(idApp, IndexInProgress.appsToCopy);
    IndexInProgress.appsReady.push(app);
  } else if (status == ASSET_HAS_ERRORS) {
    IndexInProgress.appsToUpdate = R.reject(idApp, IndexInProgress.appsToUpdate);
    IndexInProgress.appsWithErrors.push(app);
    IndexInProgress.appsToCopy = R.reject(idApp, IndexInProgress.appsToCopy);
  }
  console.log('updated Progress for ' + app.name);
  console.log(IndexInProgress.appsReady);
  console.log(IndexInProgress.appsWithErrors);
}

export function selectAppsForDownload(sourceList) {

	function shouldBeDownloaded(app) {
		const currentApp = MainIndex.findOne({appId: app.appId});
		if (!currentApp) return true;
		if (currentApp.versionNumber < app.versionNumber) return true;
		return false;
	}
	return R.filter(shouldBeDownloaded, sourceList);
};

// The input below is the list of apps selected for download, and 
// the system has indicated that all downloads are complete.
// We now need to pick out the ones that are ready.
// We first process the apps and crunch their status,
// and include only those that have status "Ready"

export function selectMainIndexUpdates(downloadList) {
	function readyForInclusion(app) {
		const status = crunchAppStatus(app);
		return (status === ASSET_READY);
	}
	return R.filter(readyForInclusion, downloadList);
};

if (Meteor.isServer) {
  Meteor.publish('mainIndex', function() {
    return MainIndex.find();
  });
};

// Assumes sources are up to date already.
export function updateIndexFromSources() {
  initializeUpdate();
  const sources = Sources.find().fetch();

  function accumulateSelected(accum, source) {
    const includedApps = selectIncludedApps(source.apps, source);
    const markedIncludedApps = R.map((app)=>{app.source = source; return app}, includedApps)
    return R.concat(accum, markedIncludedApps);
  };

  IndexInProgress.appsToInclude = R.reduce(accumulateSelected, [], sources);

  function isNeeded(app) {
    const oldApp = MainIndex.findOne({appId: app.appId, sourceId: app.sourceId});
    if (!oldApp) return true;
    if (oldApp.versionNumber < app.versionNumber) return true;
    return false;
  }

  IndexInProgress.appsToUpdate = R.filter(isNeeded, IndexInProgress.appsToInclude);
  IndexInProgress.appsToCopy = R.reject(isNeeded, IndexInProgress.appsToInclude);

  // The next thing is a bit opaque.  What we are going to do is create a bunch of
  // callers that will call fetchAllParts on an app, and store them in an array.
  // The fetchAllApps returns a Promise, so we execute these Promises one at a time
  // in a reducer, using .then to call the next caller.
  const sandstormInfo = SandstormInfo.findOne();
  function createFetchCaller(app) {
    return R.partial(fetchAllParts, [app, sandstormInfo]);
  }
  IndexInProgress.fetchCallers = R.map(createFetchCaller, IndexInProgress.appsToUpdate);

  console.log('updateIndexFromSource');

  // Ok, now call the fetchers
  // This runs a lot of server-side only code
  if (Meteor.isServer) {
    function promiseReducer(promise, caller) {
      return promise.then(caller);
    }
    //R.reduce(promiseReducer, Promise.resolve(true), IndexInProgress.fetchCallers);
    IndexInProgress.fetchCallers[0]();
  };
}
 
export function processMetadata(app) {
  if (Meteor.isServer) {
    const metadataFile = Files.findOne({appId: app._id, appVersionNumber: app.versionNumber, sourceId: app.sourceId, type: 'metadata'});
    if (!metadataFile) {
      console.log(`Could not find metadata file for ${app.name}`);
      return Promise.resolve(true);
    }

    return new Promise((resolve, reject) => {
      readFileAsString(metadataFile.path)
      .then((string) => {
        const metadata = JSON.parse(string);
        function addScreenshot(screenshot) {
          Files.insert({appId: app._id, appVersionNumber: app.versionNumber, sourceId: app.sourceId, type: 'image', path: `/images/${screenshot.imageId}`, status: 'Absent', error: ""})
        };


        R.map(addScreenshot, metadata.screenshots);
        resolve(true);
      }).catch((err) => {
        // Plow ahead
        console.log(`Error retrieving screenshot for ${app.name}`);
        console.log(err);
        resolve(true);
      })
    })
  } else {
    return Promise.resolve(true);
  }
}

export function recordProgress(app) {
  console.log(`Verifying all files complete for ${app.name}`);
  if (filesAllFetched(app)) {
    console.log('Files verified, adding to ready list')
    IndexInProgress.appsReady.push(app);
  } else {
    console.log('Files not verified')
  };

  if (IndexInProgress.appsReady.length == IndexInProgress.appsToInclude.length) {
    console.log('All apps are ready');
  }
}

Meteor.methods({
  "mainIndex.create"(app) {
    // app is assumed to have source already set.
    const appId = MainIndex.insert(app);

    const files = [
      {appId: appId, sourceId: app.sourceId, type: 'package', path: `/packages/${app.packageId}`, status: 'Absent', errmsg: ""},
      {appId: appId, sourceId: app.sourceId, type: 'metadata', path: `/apps/${app.appId}.json`, status: 'Absent', errmsg: ""},
    ];

    if (app.imageId) {
      files.push(
        {appId: appId, sourceId: app.sourceId, type: 'image', path: `/images/${app.imageId}`, status: 'Absent', errmsg: ""},
      )
    };

    function insertFile(file) {
      Files.insert(file);
    }
    // We will need to put screenshots on this list once we fetch metadata.
    R.map(insertFile, files);
    return appId;
  },

  "mainIndex.update"(id, updater) {
    // id here is app._id, not app.appId
    return MainIndex.update(id, updater);
  },

  "mainIndex.delete"(appId, sourceId) {
    // appId here is app.appId, not app._id
    return MainIndex.remove({appId: appId, sourceId: sourceId});
  },

  "mainIndex.updateFromSources"() {
    updateIndexFromSources();
  },

  "mainIndex.check"(appId) {
    const app = MainIndex.findOne({appId: appId});
    const source = Sources.findOne(app.sourceId);
    const sandstormInfo = SandstormInfo.findOne();
  }
});