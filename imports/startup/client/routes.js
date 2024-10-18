

// Import needed templates
import '/imports/ui/layouts/primaryLayout.js';
import '/imports/ui/components/loading.html';

// Set up all routes in the app
import '/client/pages/home/home';
Router.route('/', function() {
  Meteor.subscribe('index');
  this.layout('PrimaryLayout', {
    data: function() {return {active: 'home'}},
  });

  this.render('Home');

});

import '/client/pages/sources/sources';
Router.route('/sources', function() {
  Meteor.subscribe('sources');
  this.layout('PrimaryLayout', {
    data: function() {return {active: 'sources'}}
  });

  this.render('Sources');
})