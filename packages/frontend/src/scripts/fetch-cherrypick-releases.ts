import { compareVersions } from 'compare-versions';
import { version } from '@@/js/config.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

export async function fetchCherrypickReleases(): Promise<boolean> {
	try {
		const meta = await misskeyApi('admin/meta');
		const response = await fetch('https://api.github.com/repos/kokonect-link/cherrypick/releases');
		const releasesData = await response.json();

		if (!Array.isArray(releasesData) || releasesData.length === 0) {
			console.warn('No CherryPick releases found.');
			return false;
		}

		const latestRelease = meta.enableReceivePrerelease
			? releasesData[0]
			: releasesData.filter((x: any) => !x.prerelease)[0];

		if (!latestRelease || !latestRelease.tag_name || typeof latestRelease.tag_name !== 'string') {
			console.warn('Invalid latest CherryPick release:', latestRelease);
			return false;
		}

		return (
			compareVersions(version, latestRelease.tag_name) < 0 &&
			compareVersions(<string>meta.skipCherryPickVersion || version, latestRelease.tag_name) < 0
		);
	} catch (error) {
		console.error('Failed to fetch CherryPick releases:', error);
		return false;
	}
}
