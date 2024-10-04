import { Meteor } from 'meteor/meteor';
import StubCollections from 'meteor/hwillson:stub-collections';
import R from 'ramda';
import { expect } from 'chai';

import { Files } from '/imports/api/files';
import { crunchAppStatus, ASSET_READY, ASSET_NEEDS_UPDATE, ASSET_IN_PROGRESS, ASSET_HAS_ERRORS } from '/imports/lib/crunchAppStatus';

describe('crunchAppStatus', function() {
	var app = {
		appId: 'appId',
		name: 'Test App',
		appVersionNumber: 42,
		sourceId: "source1Id",
	}
	var fetchedFile0;
	var fetchedFile1;
	var fetchedFile2;
	var pendingFile0;
	var storingFile0;
	var absentFile0;
	var errorFile0;
	var wrongVersionFile0;
	var wrongVersionFile1;

	beforeEach(function () {
		StubCollections.stub([Files]);
		fetchedFile0 = {_id: 'fetchedFile0', appId: app.appId, sourceId: "source1Id", appVersionNumber: 42, status: "Fetched"};
		fetchedFile1 = {_id: 'fetchedFile1', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 42, status: "Fetched"};
		fetchedFile2 = {_id: 'fetchedFile2', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 42, status: "Fetched"};
		pendingFile0 = {_id: 'pendingFile0', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 42, status: "Fetching"};
		storingFile0 = {_id: 'storingFile0', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 42, status: "Storing"};
		absentFile0 = {_id: 'absentFile0', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 42, status: 'Absent'};
		errorFile0 = {_id: 'errorFile0', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 42, status: 'Garbage'};
		wrongVersionFile0 = {_id: 'wrongVersionFile0', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 17, status: 'Storing'};
		wrongVersionFile1 = {_id: 'wrongVersionFile1', appId: app.appId, sourceId: 'source1Id', appVersionNumber: 17, status: 'Garbate'};
	});

	afterEach(function() {
		StubCollections.restore();

	});

	it ("should return ASSET_READY if all files are ready", function() {
		Files.insert(fetchedFile0);
		Files.insert(fetchedFile1);
		Files.insert(fetchedFile2);
		expect(crunchAppStatus(app)).to.equal(ASSET_READY);
	});

	it ("should show ASSET_IN_PROGRESS if one file is in progress", function() {
		Files.insert(fetchedFile0);
		Files.insert(fetchedFile1);
		Files.insert(fetchedFile2);
		Files.insert(pendingFile0);
		expect(crunchAppStatus(app)).to.equal(ASSET_IN_PROGRESS);
	});

	it ("should show ASSET_IN_PROGRESS if one file is storing to disk", function() {
		Files.insert(fetchedFile0);
		Files.insert(fetchedFile1);
		Files.insert(fetchedFile2);
		Files.insert(storingFile0);
		expect(crunchAppStatus(app)).to.equal(ASSET_IN_PROGRESS);
	});

	it ("should show ASSET_NEEDS_UPDATE if there are no files", function() {
		Files.insert(wrongVersionFile0);
		Files.insert(wrongVersionFile1);
		expect(crunchAppStatus(app)).to.equal(ASSET_NEEDS_UPDATE);
	});

	it ("should show ASSET_NEEDS_UPDATE if there is an absent file", function() {
		Files.insert(fetchedFile0);
		Files.insert(fetchedFile1);
		Files.insert(fetchedFile2);
		Files.insert(absentFile0);
		expect(crunchAppStatus(app)).to.equal(ASSET_NEEDS_UPDATE);
	});

	it ("should show ASSET_ERRORS if there are one or more errors in downloading", function() {
		Files.insert(fetchedFile0);
		Files.insert(fetchedFile1);
		Files.insert(fetchedFile2);
		Files.insert(errorFile0);
		expect(crunchAppStatus(app)).to.equal(ASSET_HAS_ERRORS);
	});
})