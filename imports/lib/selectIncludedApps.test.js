import { Meteor } from 'meteor/meteor';
import StubCollections from 'meteor/hwillson:stub-collections';
import R from 'ramda';
import { expect } from 'chai';

import { selectIncludedApps } from '/imports/lib/selectIncludedApps';

describe('selectIncludedApps', function() {
	var source0 = {
		_id: 'nonexcludingsourceId',
		blacklist: [],
	};

	var source1 = {
		_id: 'sourceId',
		blacklist: ['badId1', 'badId2', 'badId3'],
	};

	var app1 = {
		appId: 'appId1',
	};

	var app2 = {
		appId: 'appId2',
	};

	var app3 = {
		appId: 'appId3',
	};

	var badApp1 = {
		appId: 'badId1',
	};

	var badApp2 = {
		appId: 'badId3',
	};


	it("should return apps which are in master list", function(){
		const list = [app1, app2, app3];
		const result1 = selectIncludedApps(list, source0);
		expect(result1.length).to.equal(3);
		expect(result1[0].appId).to.equal('appId1');
		expect(result1[1].appId).to.equal('appId2');
		expect(result1[2].appId).to.equal('appId3');

		// This has a blacklist, but it should not get any hits.
		const result2 = selectIncludedApps(list, source1);
		expect(result2.length).to.equal(3);
		expect(result2[0].appId).to.equal('appId1');
		expect(result2[1].appId).to.equal('appId2');
		expect(result2[2].appId).to.equal('appId3');

	});

	it("should not return apps which have their appId in the blacklist", function() {
		const list = [app1, badApp1, app2, app3, badApp2];
		const result1 = selectIncludedApps(list, source0);
		expect(result1.length).to.equal(5);

		const result2 = selectIncludedApps(list, source1);
		expect(result2.length).to.equal(3);
		expect(result2[0].appId).to.equal('appId1');
		expect(result2[1].appId).to.equal('appId2');
		expect(result2[2].appId).to.equal('appId3');		
	});
})