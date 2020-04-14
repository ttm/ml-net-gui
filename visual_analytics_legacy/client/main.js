// import { Template } from 'meteor/templating';
// import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
// import { Session } from 'meteor/session'

// import { PIXI, mpixi, mpixib } from './mypixi.js';

import './myrouter.js';

import './main.html';

Meteor.startup( () => {
  // const state = new ReactiveDict(); // use Session var TTM
  // state.set('phase', 'started')
  // window.state = state
  // Meteor.mstate = state
});

// Template.renderCanvas.onRendered(function helloOnCreated() {
//   // render on individual templates
// });
