import { Template } from 'meteor/templating';
import R from 'ramda';

import { Sources } from '/imports/api/sources';

import './appRow.html';

Template.AppRow.onCreated(function() {
});

Template.AppRow.helpers({
	isIncluded() {
		const appId = Template.currentData().app.appId;
		const blacklist = Template.currentData().source.blacklist;
		const index = R.findIndex(R.equals(appId), blacklist);
		return (index < 0) ? 'checked' : '';
	}
})

Template.AppRow.events({
  "click .js-include-app-checkbox"(event) {
    const state = event.currentTarget.checked;
    const appId = Template.currentData().app.appId;
    const source = Template.currentData().source;
    const blacklist = source.blacklist;
    if (event.currentTarget.checked) {
      source.blacklist = R.reject(R.equals(appId), blacklist);
    } else {
      source.blacklist = (R.findIndex(R.equals(appId), blacklist) >= 0) ? blacklist : R.append(appId, blacklist);
    };
    Meteor.call("sources.update", source._id, source);
  }

});

function getSource() {
  return Template.currentData().source;
}
