<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :data-is-hidden="hide ? 'true' : 'false'" :class="[hide ? $style.hidden : $style.visible, (image.isSensitive && defaultStore.state.highlightSensitiveMedia) && $style.sensitive]" @click="onClick($event)" @dblclick="onDblClick">
	<component
		:is="(disableImageLink || hide) ? 'div' : 'a'"
		v-bind="(disableImageLink || hide) ? {
			title: image.name,
			class: $style.imageContainer,
		} : {
			title: image.name,
			class: $style.imageContainer,
			href: image.url,
			style: 'cursor: zoom-in;'
		}"
	>
		<ImgWithBlurhash
			:hash="image.blurhash"
			:src="(defaultStore.state.dataSaver.media && hide) ? null : url"
			:forceBlurhash="hide"
			:cover="hide || cover"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.7);' : null"
			@mouseover="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = true : ''"
			@mouseout="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = false : ''"
			@touchstart="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = true : ''"
			@touchend="defaultStore.state.showingAnimatedImages === 'interaction' ? playAnimation = false : ''"
		/>
	</component>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.dataSaver.media ? ` (${i18n.ts.image}${image.size ? ' ' + bytes(image.size) : ''})` : '' }}</b>
				<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ defaultStore.state.dataSaver.media && image.size ? bytes(image.size) : i18n.ts.image }}</b>
				<span v-if="controls" style="display: block;">{{ clickToShowMessage }}</span>
			</div>
		</div>
	</template>
	<template v-else-if="controls">
		<div :class="$style.indicators">
			<div v-if="['image/gif'].includes(image.type)" :class="$style.indicator">GIF</div>
			<div v-if="['image/apng'].includes(image.type)" :class="$style.indicator">APNG</div>
			<div v-if="image.comment" :class="$style.indicator">ALT</div>
			<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
		<button :class="$style.menu" class="_button" @click.stop="showMenu"><i class="ti ti-dots" style="vertical-align: middle;"></i></button>
		<i class="ti ti-eye-off" :class="$style.hide" @click.stop="hide = true"></i>
	</template>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, watch, ref, computed } from 'vue';
import * as Misskey from 'cherrypick-js';
import type { MenuItem } from '@/types/menu.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';
import bytes from '@/filters/bytes.js';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { $i, iAmModerator } from '@/account.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';

const props = withDefaults(defineProps<{
	image: Misskey.entities.DriveFile;
	raw?: boolean;
	cover?: boolean;
	disableImageLink?: boolean;
	controls?: boolean;
}>(), {
	cover: false,
	disableImageLink: false,
	controls: true,
});

const hide = ref(true);

const playAnimation = ref(true);
if (defaultStore.state.showingAnimatedImages === 'interaction') playAnimation.value = false;
let playAnimationTimer = setTimeout(() => playAnimation.value = false, 5000);
const url = computed(() => (props.raw || defaultStore.state.loadRawImages)
	? props.image.url
	: (defaultStore.state.disableShowingAnimatedImages || defaultStore.state.dataSaver.media) || (['interaction', 'inactive'].includes(<string>defaultStore.state.showingAnimatedImages) && !playAnimation.value)
		? getStaticImageUrl(props.image.url)
		: props.image.thumbnailUrl,
);

const clickToShowMessage = computed(() => defaultStore.state.nsfwOpenBehavior === 'click'
	? i18n.ts.clickToShow
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	: defaultStore.state.nsfwOpenBehavior === 'doubleClick'
		? i18n.ts.doubleClickToShow
		: '',
);

async function onClick(ev: MouseEvent) {
	if (!props.controls) {
		return;
	}

	if (hide.value) {
		ev.stopPropagation();
		if (props.image.isSensitive && defaultStore.state.confirmWhenRevealingSensitiveMedia) {
			const { canceled } = await os.confirm({
				type: 'question',
				text: i18n.ts.sensitiveMediaRevealConfirm,
			});
			if (canceled) return;
		}
	}

	if (defaultStore.state.nsfwOpenBehavior === 'doubleClick') os.popup(MkRippleEffect, { x: ev.clientX, y: ev.clientY }, {}, 'end');
	if (defaultStore.state.nsfwOpenBehavior === 'click') hide.value = false;
}

function onDblClick() {
	if (!props.controls) return;
	if (hide.value && defaultStore.state.nsfwOpenBehavior === 'doubleClick') hide.value = false;
}

function resetTimer() {
	playAnimation.value = true;
	clearTimeout(playAnimationTimer);
	playAnimationTimer = setTimeout(() => playAnimation.value = false, 5000);
}

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, () => {
	hide.value = (defaultStore.state.nsfw === 'force' || defaultStore.state.dataSaver.media) ? true : (props.image.isSensitive && defaultStore.state.nsfw !== 'ignore');
}, {
	deep: true,
	immediate: true,
});

function showMenu(ev: MouseEvent) {
	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: i18n.ts.hide,
		icon: 'ti ti-eye-off',
		action: () => {
			hide.value = true;
		},
	});

	if (iAmModerator) {
		menuItems.push({
			text: i18n.ts.markAsSensitive,
			icon: 'ti ti-eye-exclamation',
			danger: true,
			action: () => {
				os.apiWithDialog('drive/files/update', { fileId: props.image.id, isSensitive: true });
			},
		});
	}

	const details: MenuItem[] = [];
	if ($i?.id === props.image.userId) {
		details.push({
			type: 'link',
			text: i18n.ts._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${props.image.id}`,
		});
	}

	if (iAmModerator) {
		details.push({
			type: 'link',
			text: i18n.ts.moderation,
			icon: 'ti ti-photo-exclamation',
			to: `/admin/file/${props.image.id}`,
		});
	}

	if (details.length > 0) {
		menuItems.push({ type: 'divider' }, ...details);
	}

	if (defaultStore.state.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-id',
			text: i18n.ts.copyFileId,
			action: () => {
				copyToClipboard(props.image.id);
			},
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

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
});
</script>

<style lang="scss" module>
.hidden {
	position: relative;
	-webkit-tap-highlight-color: transparent;
}

.sensitive {
	position: relative;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		border-radius: inherit;
		box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
	}
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
}

.hide {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: var(--MI_THEME-bg);
	color: var(--MI_THEME-accentLighten);
	font-size: 18px;
	opacity: .7;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 12px;
	right: 12px;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	-webkit-tap-highlight-color: transparent;
	//box-shadow: 0 0 0 1px var(--MI_THEME-divider) inset;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
}

html[data-color-scheme=dark] .visible {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .visible {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.menu {
	display: block;
	position: absolute;
	border-radius: 999px;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	color: #fff;
	font-size: 0.8em;
	width: 28px;
	height: 28px;
	text-align: center;
	bottom: 10px;
	right: 10px;
}

.imageContainer {
	display: block;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 10px;
	left: 10px;
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
