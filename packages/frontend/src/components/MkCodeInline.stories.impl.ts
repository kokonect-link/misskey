/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkCodeInline from './MkCodeInline.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkCodeInline,
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
			template: '<MkCodeInline v-bind="props"/>',
		};
	},
	args: {
		code: '<: "Hello, world!"',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCodeInline>;
