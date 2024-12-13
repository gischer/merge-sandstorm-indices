import { Template } from 'meteor/templating';
import R from 'ramda';

import { Sources } from '/imports/api/sources';

import './show.html';
import './appRow';

Template.ShowSource.onCreated(function() {
});

Template.ShowSource.helpers({
  source() {
    const source = getSource();
    if (!!source) {
      return source;
    }
    return {name: "Fake Source Name"}
  },

  sources() {
    return Sources.find().fetch();
  },

  isIncluded(app) {
    const source = getSource();
    const index = R.findIndex(app.appId, source.blacklist);
    return (R.findIndex(app.appId, source.blacklist) < 0) ? 'checked' : '';
  },
});

Template.ShowSource.events({
  'click button#commit-source-to-main'(event) {
    Meteor.call('mainIndex.updateFromSources');
  }
})

function getSource() {
  return Sources.findOne(Template.currentData().id);
}
