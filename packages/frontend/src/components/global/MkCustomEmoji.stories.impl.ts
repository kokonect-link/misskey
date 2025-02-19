/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkCustomEmoji from './MkCustomEmoji.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkCustomEmoji,
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
			template: '<MkCustomEmoji v-bind="props" />',
		};
	},
	args: {
		name: 'mi',
		url: 'https://github.com/kokonect-link/cherrypick/blob/master/packages/frontend/assets/about-icon.png?raw=true',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export const Normal = {
	...Default,
	args: {
		...Default.args,
		normal: true,
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export const Missing = {
	...Default,
	args: {
		name: Default.args.name,
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export const ErrorToText = {
	...Default,
	args: {
		url: 'https://example.com/404',
		name: Default.args.name,
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export const ErrorToImage = {
	...Default,
	args: {
		url: 'https://example.com/404',
		name: Default.args.name,
		fallbackToImage: true,
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
