import R from 'ramda';

export function selectIncludedApps(appList, source) {
	function isBlacklisted(app) {
		const result = R.includes(app.appId, source.blacklist);
		return result;
	};

	return  R.reject(isBlacklisted, appList);
} 