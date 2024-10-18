

// Import needed templates
import '/imports/ui/layouts/primaryLayout.js';

// Set up all routes in the app
import '/client/pages/home/home';
Router.route('/', function() {
  this.layout('PrimaryLayout', {
    data: function() {return {active: 'home'}},
  });
  this.render('Home');
});

import '/client/pages/test.html';
Router.route('/test', {
  template: 'Test',
})
