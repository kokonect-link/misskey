<!--
SPDX-FileCopyrightText: syuilo and misskey-project & noridev and cherrypick-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="600"
	:height="1000"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts._mfc.cheatSheet }}</template>
	<XMfmCheatSheet :popup="true" style="background: var(--MI_THEME-bg)"/>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import XMfmCheatSheet from '@/pages/mfc-cheat-sheet.vue';
import { i18n } from '@/i18n.js';

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('done');
	dialog.value?.close();
}
</script>
