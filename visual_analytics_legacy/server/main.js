import { Meteor } from 'meteor/meteor';
const fs = require('fs');

import { Backimages } from '../imports/api/backimages/backimages.js';
import { Participants } from '../imports/api/participants/participants.js';
import { ML } from '../imports/api/ml/ml.js';

let B = Backimages.rawCollection();
B.drop();

const path = require("path");
Meteor.rootPath = path.resolve('.');
Meteor.absolutePath = Meteor.rootPath.split(path.sep + '.meteor')[0];
const a = Meteor.absolutePath;


let mfiles;
fs.readdir(a + "/public/images/ets/", (err, files) => {
  mfiles = files;
  files.forEach(file => {
    let foo = B.findOne({name: file}).then( (r, a) => {
      console.log(r, a);
      if (r == null) {
        B.insert({ name: file });
      }
    });
  });
});

let mfiles2;
fs.readdir(
  // '/home/renato/repos/mynsaLegacy/meteor/sandbox/try1/public/images/sprites/',
  a + '/public/images/sprites/',
  (err, files) => { mfiles2 = files; }
);

Meteor.startup( () => {
});

Meteor.methods({
  getBackfiles () {
    return mfiles;
    // return Backimages.find();
  },
  getBackdancers () {
    return mfiles2;
  },
  getParticipants () {
    return Participants.find().fetch();
  },
  insertParticipants (participants) {
    for (let i = 0; i < participants.length; i++) {
      Participants.insert(participants[i]);
    }
  },
  insertML (ml) {
    // console.log('ml to be added');
    ML.insert(ml);
  },
  getML (mid) {
    let ml = ML.findOne({_id: mid});
    // console.log('ml to be retrieved', mid, ml);
    return ml;
  }
});
