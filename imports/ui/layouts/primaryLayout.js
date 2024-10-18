import { Template } from 'meteor/templating';

import { Sources } from '/imports/api/sources';

import './primaryLayout.html';
import '/imports/ui/components/navbar'

Template.PrimaryLayout.helpers({
	sources() {
		return Sources.find({}).fetch();
	}
})