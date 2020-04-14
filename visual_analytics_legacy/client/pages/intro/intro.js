import { Template } from 'meteor/templating';
import './intro.html';

let texts = {
  argument: [
    `Reptilians abound in our social structures.  Some of our friends are sometimes captive, and reptilians themselves walk among us.`,
    `By freeing their influence and helping key-friends, you unlock abilities which enables you to harness your social circuits for achieving arbitrary goals of your choice/discernment for world transcendence.`
  ],
  proposal: [
    `You are being called by The Great Fraternity of Light to free humanity from slavery.`,
    `We welcome you, beloved light-workers.`
  ],
};

Template.mintro.helpers({
    texts: [
          texts.argument,
          texts.proposal,
        ],
});
