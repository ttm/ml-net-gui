import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import './myrouter.html';
import './mconductor/mconductor.js';
import './pages/net/';
import './pages/search/';
import './pages/search2/';
import './pages/intro/';
import './pages/ml/';
import './pages/ml/net/';
import './pages/cascade/';

// https://youtu.be/sGnZ8-YvxtM?t=292 TTM

FlowRouter.route('/cascade/:_id/', {
  name: 'cascade',
  action(params, queryParams) {
    window.qparams = queryParams;
    window.uparams = params;
    BlazeLayout.render('cascade');
  }
});

FlowRouter.route('/ml/', {
  name: 'ml',
  action(params, queryParams) {
    BlazeLayout.render('ml');
  }
});

FlowRouter.route('/ml/net/', { // to be used with ?id=<snapshot_id>
  name: 'mlnet',
  action(params, queryParams) {
    console.log(params, queryParams);
    window.qparams = queryParams;
    BlazeLayout.render('mlnet');
  }
});
// FlowRouter.route('/ml/search2/', { // to be used with ?mstring=<some string to be searched>
//   name: 'mlsearch',
//   action(params, queryParams) {
//     console.log(params, queryParams);
//     window.qparams = queryParams;
//     BlazeLayout.render('mlsearch');
//   }
// });

FlowRouter.route('/', {
  name: 'base',
  action(params, queryParams) {
    BlazeLayout.render('mconductor');
  }
});

FlowRouter.route('/intro/', {
  name: 'intro',
  action(params, queryParams) {
    console.log('in intro template');
    BlazeLayout.render('mintro');
  }
});

FlowRouter.route('/net/', { // to be used with ?id=<snapshot_id>
  name: 'netname',
  action(params, queryParams) {
    console.log(params, queryParams);
    window.qparams = queryParams;
    BlazeLayout.render('net');
  }
});

FlowRouter.route('/search/', { // to be used with ?mstring=<some string to be searched>
  name: 'searchname',
  action(params, queryParams) {
    console.log(params, queryParams);
    window.qparams = queryParams;
    BlazeLayout.render('search');
  }
});

FlowRouter.route('/search2/', { // to be used with ?mstring=<some string to be searched>
  name: 'searchname2',
  action(params, queryParams) {
    console.log(params, queryParams);
    window.qparams = queryParams;
    BlazeLayout.render('search2');
  }
});

FlowRouter.route('/tests/:_id', {
  name: 'Tests',
  action(params, queryParams) {
    BlazeLayout.render('routed_body', {main: params._id});
    console.log("Looking at a list?", params, queryParams);
  }
});
