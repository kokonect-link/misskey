/*
 * SPDX-FileCopyrightText: syuilo and misskey-project & noridev and cherrypick-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkUserSetupDialog_Blur from './MkUserSetupDialog.Blur.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog_Blur,
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
			template: '<MkUserSetupDialog_Blur v-bind="props" />',
		};
	},
	args: {

	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSetupDialog_Blur>;
