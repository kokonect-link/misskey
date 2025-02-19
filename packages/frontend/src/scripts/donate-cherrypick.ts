/*
 * SPDX-FileCopyrightText: noridev and cherrypick-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os.js';

export function donateCherryPick(ev: MouseEvent) {
	os.popupMenu([{
		text: 'Patreon',
		icon: 'ti ti-pig-money',
		action: () => {
			window.open('https://www.patreon.com/noridev', '_blank');
		},
	}, {
		text: 'Paypal',
		icon: 'ti ti-pig-money',
		action: () => {
			window.open('https://www.paypal.me/noridev', '_blank');
		},
	}, {
		text: 'GitHub Sponsers',
		icon: 'ti ti-pig-money',
		action: () => {
			window.open('https://github.com/sponsors/noridev', '_blank');
		},
	}, {
		text: 'Kakao Pay',
		icon: 'ti ti-pig-money',
		action: () => {
			window.open('https://qr.kakaopay.com/Ej9SHx6pQ', '_blank');
		},
	}, {
		text: 'pixivFANBOX',
		icon: 'ti ti-pig-money',
		action: () => {
			window.open('https://noridev.fanbox.cc/plans', '_blank');
		},
	}], ev.currentTarget ?? ev.target);
}
