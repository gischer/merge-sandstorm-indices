import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'

import { Config } from '/imports/startup/both/config';
import { Sources } from '/imports/api/sources';
import { getSandstormInfo, getPublicId } from '/imports/lib/sandstorm';

// This is a singleton, it contains only one record.
// We do this as a collection to enable the auto-updating.

export const SandstormInfo = new Mongo.Collection('sandstorm.info');

if (Meteor.isServer) {
  Meteor.publish('sandstorm.info', function() {
    console.log('fetching sandstorm.info')
    var cursor = SandstormInfo.find();
    if (cursor.count() == 0) {
      const sandstormInfo = getSandstormInfo(this);
      const lines = getPublicId(sandstormInfo.sessionId);
      const lineA = lines.split('\n');
      console.log(lineA);
      sandstormInfo.publicId = lineA[0];
      sandstormInfo.publicIdPath = lineA[2];
      SandstormInfo.insert(sandstormInfo);
      cursor = SandstormInfo.find();
    }
    return cursor;
  })
};

import FS from 'fs';
Meteor.methods({
  'sandstorm.claimAccessToken'(token) {
    const self = this;
    if (Meteor.isServer) {
      import AXIOS from 'axios';
      const info = SandstormInfo.findOne();
      async function makeRequest(info, token) {
        var cap = "dummy";
        await AXIOS({
          method: 'post',
          url: `http://http-bridge/session/${info.sessionId}/claim`,
          data: {
            "requestToken": token,
            "requiredPermissions": [],
          }
        }).then((response) => {
          cap = response.data.cap;
          console.log(response.data.cap);
        });
        return cap;
      };

      return makeRequest(info, token);
    }
  },

})
