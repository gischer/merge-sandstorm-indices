import R from 'ramda'

import { Files } from '/imports/api/files';

export const ASSET_READY = "Ready";
export const ASSET_NEEDS_UPDATE = "Needs update";
export const ASSET_IN_PROGRESS = "In progress";
export const ASSET_HAS_ERRORS = "Errors";

export function crunchAppStatus(app) {
  function statusReducer(accum, file) {
      if (accum === 'In progress') return 'In progress';
      if (accum === 'Errors') return 'Errors';
      if (accum === 'Needs update') return 'Needs update';
      if (accum === 'Ready') {
        if (file.status === 'Fetching' || file.status === 'Storing') return 'In progress';
        if (file.status === 'Absent') return 'Needs update';
        if (file.status === 'Fetched') return 'Ready';
        return 'Errors';
      }
  }

  const files = Files.find({appId: app.appId, sourceId: app.sourceId, appVersionNumber: app.appVersionNumber}).fetch();
  if (files.length == 0) {
    console.log(`${app.name} is new`);
    return "Needs update";
  }
  return R.reduce(statusReducer, 'Ready', files);
}