import R from 'ramda'

import { Files } from '/imports/api/files';

export const ASSET_READY = "Ready";
export const ASSET_NEEDS_UPDATE = "Needs update";
export const ASSET_IN_PROGRESS = "In progress";
export const ASSET_HAS_ERRORS = "Errors";

export function crunchAppStatus(app) {
  function statusReducer(accum, file) {
      if (accum === ASSET_IN_PROGRESS) return ASSET_IN_PROGRESS;
      if (accum === ASSET_HAS_ERRORS) return ASSET_HAS_ERRORS;
      if (accum === ASSET_NEEDS_UPDATE) return ASSET_NEEDS_UPDATE;
      if (accum === ASSET_READY) {
        if (file.status === 'Fetching' || file.status === 'Storing') return ASSET_IN_PROGRESS;
        if (file.status === 'Absent') return ASSET_NEEDS_UPDATE;
        if (file.status === ASSET_READY) return ASSET_READY;
        return ASSET_HAS_ERRORS;
      }
  }

  const files = Files.find({appId: app.appId, sourceId: app.sourceId, appVersionNumber: app.versionNumber}).fetch();
  if (files.length == 0) {
    console.log(`${app.name} is new`);
    return "Needs update";
  }
  return R.reduce(statusReducer, 'Ready', files);
}