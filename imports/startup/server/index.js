import { Meteor } from 'meteor/meteor';

import { setBaseDir } from '/imports/lib/store';

Meteor.startup(() => {
  // if the Links collection is empty
  setBaseDir();
});
