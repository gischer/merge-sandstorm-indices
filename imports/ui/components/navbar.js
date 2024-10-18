import { Template } from 'meteor/templating';

import "./navbar.html";

Template.Navbar.onCreated(function() {

});

Template.Navbar.helpers({
  sources() {
    return Template.currentData().sources;
  },

  active(name) {
    const activePage = Template.currentData().active;
    if (activePage === name) return 'active';
    return "";
  },
});

Template.Navbar.events({

});
