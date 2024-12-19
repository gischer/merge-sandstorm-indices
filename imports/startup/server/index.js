import { Meteor } from 'meteor/meteor';

import { Files } from '/imports/api/files';
import { setStartDir } from '/imports/lib/store';

Meteor.startup(() => {
  // if the Links collection is empty
  setStartDir();
  Files.remove({});
});
