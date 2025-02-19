/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkEvent from './MkEvent.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkEvent,
			},
			setup() {
				return {
					args,
				};
			},
			beforeMount () {
				document.body.style.background = 'var(--panel)';
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkEvent v-bind="props" />',
		};
	},
	args: {
		note: {
			event: {
				title: 'Come on a Tea Party!',
				start: '2017-10-25T15:00:00+0900',
				end: '2017-10-25T18:00:00+0900',
				metadata: {
					'@type': 'Event',
					location: 'Kawasaki, Japan',
					description: 'Let\'s have a tea party!',
				},
			},
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEvent>;
