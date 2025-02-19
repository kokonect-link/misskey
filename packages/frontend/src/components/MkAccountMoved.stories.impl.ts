/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { action } from '@storybook/addon-actions';
import { HttpResponse, http } from 'msw';
import { commonHandlers } from '../../.storybook/mocks.js';
import { userDetailed } from '../../.storybook/fakes.js';
import MkAccountMoved from './MkAccountMoved.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkAccountMoved,
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
			template: '<MkAccountMoved v-bind="props" />',
		};
	},
	args: {
		movedTo: userDetailed().id,
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/show', async ({ request }) => {
					action('POST /api/users/show')(await request.json());
					return HttpResponse.json(userDetailed());
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAccountMoved>;
