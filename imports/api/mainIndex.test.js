import { Meteor } from 'meteor/meteor';
import StubCollections from 'meteor/hwillson:stub-collections';
import R from 'ramda';
import { expect } from 'chai';

import { selectAppsForDownload, selectMainIndexUpdates, MainIndex } from '/imports/api/mainIndex';
import { Files } from '/imports/api/files';

describe("MainIndex", function() {
	describe("selectAppsForDownload", function() {
		var app1 = {
			appId: "app1Id",
			name: "App 1",
			versionNumber: 101,
		};

		var app2 = {
			appId: "app2Id", 
			name: "App 2",
			versionNumber: 102,
		};

		var app3 = {
			appId: "app3Id",
			name: "App 3",
			versionNumber: 103,
		};

		var newApp2 = {
			appId: "app2Id",
			name: "App2",
			versionNumber: 201,
		};

		var strangeApp3 = {
			appId: "app3Id",
			name: "App 3 Strange",
			versionNumber: 93, // lower than the existing main index app3.
		};

		var app4 = {
			appId: "app4Id",
			name: "App 4 (New!)",
			versionNumber: 1,
		}

		var mainIndexApps = [app1, app2, app3];


		beforeEach(function() {
			StubCollections.stub([MainIndex]);
			MainIndex.insert(app1);
			MainIndex.insert(app2);
			MainIndex.insert(app3);
		});

		afterEach(function() {
			StubCollections.restore();
		});

		it("selects apps which have new versions", function() {
			const sourceList = [app1, newApp2];
			const downloadList = selectAppsForDownload(sourceList);
			expect(downloadList.length).to.equal(1);
			expect(downloadList[0]).to.deep.equal(newApp2);
		});

		it("selects apps that aren't in the main index yet", function() {
			const sourceList = [app1, newApp2, app4];
			const downloadList = selectAppsForDownload(sourceList);
			expect(downloadList.length).to.equal(2);
			expect(downloadList[0]).to.deep.equal(newApp2);
			expect(downloadList[1]).to.deep.equal(app4);
		});
	});
	describe("selectMainIndexUpdates", function() {
		var app1 = {
			appId: "app1Id",
			name: "App 1",
			versionNumber: 101,
			sourceId: 'source1Id',
		};

		var app2 = {
			appId: "app2Id", 
			name: "App 2",
			versionNumber: 102,
			sourceId: 'source1Id',
		};

		var app3 = {
			appId: "app3Id",
			name: "App 3",
			versionNumber: 103,
			sourceId: 'source1Id',
		};

		var newApp2 = {
			appId: "app2Id",
			name: "App2",
			versionNumber: 201,
			sourceId: 'source1Id',
		};

		var strangeApp3 = {
			appId: "app3Id",
			name: "App 3 Strange",
			versionNumber: 93, // lower than the existing main index app3.
			sourceId: 'source1Id',
		};

		var app4 = {
			appId: "app4Id",
			name: "App 4 (New!)",
			versionNumber: 1,
			sourceId: 'source1Id',
		};

		beforeEach(function() {
			StubCollections.stub([Files]);
			// app1
			Files.insert({path: 'file1', appId: 'app1Id', sourceId: 'source1Id', appVersionNumber: 101, status: 'Ready'});
			Files.insert({path: 'file2', appId: 'app1Id', sourceId: 'source1Id', appVersionNumber: 101, status: 'Ready'});
			// app2
			Files.insert({path: 'file3', appId: 'app2Id', sourceId: 'source1Id', appVersionNumber: 102, status: 'Ready'});
			Files.insert({path: 'file4', appId: 'app2Id', sourceId: 'source1Id', appVersionNumber: 102, status: 'Ready'});
			// app3
			Files.insert({path: 'file5', appId: 'app3Id', sourceId: 'source1Id', appVersionNumber: 103, status: 'Ready'});
			Files.insert({path: 'file6', appId: 'app3Id', sourceId: 'source1Id', appVersionNumber: 103, status: 'Ready'});
		});

		afterEach(function() {
			StubCollections.restore();
		});

		it("selects apps which have sucessfully downloaded all files and are marked Ready", function() {
			const downloadList = [app1, app2, app3];
			const updateList = selectMainIndexUpdates(downloadList);
			expect(updateList.length).to.equal(3);
			expect(updateList[0].appId).to.equal('app1Id');
			expect(updateList[1].appId).to.equal('app2Id');
			expect(updateList[2].appId).to.equal('app3Id');
		});

		it("rejects apps which are marked with errors");
		it("rejects apps which are incomplete");
	})
});