<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent" :class="$style.root" :data-transparent="widgetProps.transparent ? true : null" data-cy-mkw-photos class="mkw-photos">
	<template #icon><i class="ti ti-camera"></i></template>
	<template #header>{{ i18n.ts._widgets.photos }}</template>

	<div class="">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.stream">
			<div
				v-for="(image, i) in images" :key="i"
				:class="$style.img"
				:style="`background-image: url(${thumbnail(image)})`"
				@mouseover="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = true : ''"
				@mouseout="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = false : ''"
				@touchstart="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = true : ''"
				@touchend="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = false : ''"
			>
				<div :class="$style.indicators">
					<div v-if="['image/gif'].includes(image.type)" :class="$style.indicator">GIF</div>
					<div v-if="['image/apng'].includes(image.type)" :class="$style.indicator">APNG</div>
					<div v-if="image.comment" :class="$style.indicator">ALT</div>
					<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
				</div>
			</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as Misskey from 'cherrypick-js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import { useStream } from '@/stream.js';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkContainer from '@/components/MkContainer.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';

const name = 'photos';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const connection = useStream().useChannel('main');
const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(true);

const onDriveFileCreated = (file) => {
	if (/^image\/.+$/.test(file.type)) {
		images.value.unshift(file);
		if (images.value.length > 9) images.value.pop();
	}
};

const playAnimation = ref(true);
if (defaultStore.state.showingAnimatedImages === 'interaction') playAnimation.value = false;
let playAnimationTimer = setTimeout(() => playAnimation.value = false, 5000);
const thumbnail = (image: Misskey.entities.DriveFile): string => {
	return (defaultStore.state.disableShowingAnimatedImages || defaultStore.state.dataSaver.media) || (['interaction', 'inactive'].includes(<string>defaultStore.state.showingAnimatedImages) && !playAnimation.value)
		? getStaticImageUrl(image.url)
		: image.thumbnailUrl ?? image.url;
};

function resetTimer() {
	playAnimation.value = true;
	clearTimeout(playAnimationTimer);
	playAnimationTimer = setTimeout(() => playAnimation.value = false, 5000);
}

misskeyApi('drive/stream', {
	type: 'image/*',
	limit: 9,
}).then(res => {
	images.value = res;
	fetching.value = false;
});

connection.on('driveFileCreated', onDriveFileCreated);

onMounted(() => {
	if (defaultStore.state.showingAnimatedImages === 'inactive') {
		window.addEventListener('mousemove', resetTimer);
		window.addEventListener('touchstart', resetTimer);
		window.addEventListener('touchend', resetTimer);
	}
});

onUnmounted(() => {
	if (defaultStore.state.showingAnimatedImages === 'inactive') {
		window.removeEventListener('mousemove', resetTimer);
		window.removeEventListener('touchstart', resetTimer);
		window.removeEventListener('touchend', resetTimer);
	}

	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root[data-transparent] {
	.stream {
		padding: 0;
	}

	.img {
		border: solid 4px transparent;
		border-radius: 8px;
	}
}

.stream {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px;

	.img {
		flex: 1 1 33%;
		width: 33%;
		height: 80px;
		box-sizing: border-box;
		background-position: center center;
		background-size: cover;
		background-clip: content-box;
		border: solid 2px transparent;
		border-radius: 4px;
	}
}

.indicators {
	display: inline-flex;
	margin: 3px 0 0 3px;
	pointer-events: none;
	opacity: .5;
	gap: 6px;
}

.indicator {
	/* Hardcode to black because either --MI_THEME-bg or --MI_THEME-fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: var(--MI_THEME-accentLighten);
	display: inline-block;
	font-weight: bold;
	font-size: 0.8em;
	padding: 2px 5px;
}
</style>
