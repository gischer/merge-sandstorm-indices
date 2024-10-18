import { Meteor } from 'meteor/meteor';
import StubCollections from 'meteor/hwillson:stub-collections';
import R from 'ramda';
import { expect } from 'chai';

import { Sources, getIncludedApps } from '/imports/api/sources';

describe("Sources", function() {
	var source0Id;
	var source1Id;
	var app0;
	var app1;
	var app2;
	var app3;
	var app4;

	beforeEach(function() {
		StubCollections.stub[Sources];
		app0 = {
			appId: 'app0Id',
			data: 'app0data',
		};

		app1 = {
			appId: "app1Id",
			data: 'app1Data',
		};

		app2 = {
			appId: "app2Id",
			data: 'app2Data',
		};

		app3 = {
			appId: "app3Id",
			data: "app3Data"
		};

		app4 = {
			appId: "app4Id",
			data: 'app4Data',
		};

		const source0 = {
			name: "Source 0",
			apps: [
				app0,
				app1,
				app2,
				app3,
				app4
			],
			blacklist: [],
		};

		source0Id = Sources.insert(source0)

		const source1 = {
			name: "Source 1",
			apps: [
				app0,
				app1,
				app2,
				app3,
				app4
				],
			blacklist: ["app3Id", "app2Id"],
		}

		source1Id = Sources.insert(source1);
	});

	afterEach(function() {
		StubCollections.restore();
	});

	describe("getIncludedApps", function(){
		it("gets the apps from the database and returns a list of apps (not appIds)", function() {
			const result = getIncludedApps(source0Id);
			expect(result.length).to.equal(5);
			expect(result[0]).to.deep.equal(app0);
			expect(result[1]).to.deep.equal(app1);
			expect(result[2]).to.deep.equal(app2);
			expect(result[3]).to.deep.equal(app3);
		});

		it("ignores apps that are blacklisted", function() {
			const result = getIncludedApps(source1Id);
			expect(result.length).to.equal(3);
			expect(result[0]).to.deep.equal(app0);
			expect(result[1]).to.deep.equal(app1);
			expect(result[2]).to.deep.equal(app4);
		});
	});

});