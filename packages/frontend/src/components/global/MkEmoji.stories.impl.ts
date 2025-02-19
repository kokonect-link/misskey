/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkEmoji from './MkEmoji.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkEmoji,
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
			template: '<MkEmoji v-bind="props" />',
		};
	},
	args: {
		emoji: '❤',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEmoji>;
