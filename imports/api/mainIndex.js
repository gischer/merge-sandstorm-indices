import { Mongo } from 'meteor/mongo';

import R from 'ramda';

import { Config } from '/imports/startup/both/config';
import { Files } from '/imports/api/files';
import { crunchAppStatus, ASSET_READY } from '/imports/lib/crunchAppStatus';



export const MainIndex = new Mongo.Collection('index');

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
});