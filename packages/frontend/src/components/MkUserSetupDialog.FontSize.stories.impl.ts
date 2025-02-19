/*
 * SPDX-FileCopyrightText: syuilo and misskey-project & noridev and cherrypick-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkUserSetupDialog_FontSize from './MkUserSetupDialog.FontSize.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog_FontSize,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkUserSetupDialog_FontSize v-bind="props" />',
		};
	},
	args: {

	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSetupDialog_FontSize>;
