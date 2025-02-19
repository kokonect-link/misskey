/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkError from './MkError.vue';
import type { Meta } from '@storybook/vue3';

export const argTypes = {
	onRetry: {
		action: 'retry',
	},
} satisfies Meta<typeof MkError>['argTypes'];
