// Routes

import { Config } from '/imports/startup/both/config';

const testIndex = '{"apps", [{"name": "App 1"}, {"name": "App 2"}]}';
Router.route('/apps/index.json', function() {
	this.response.setHeader('Content-type', 'application/json');
	this.response.writeHead(200);
	this.response.end(testIndex);
}, {where: 'server'})