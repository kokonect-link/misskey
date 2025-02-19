<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<CPPageHeader v-if="isMobile && defaultStore.state.mobileHeaderChange" v-model:tab="src" :actions="headerActions" :tabs="$i ? headerTabs : headerTabsWhenNotLogin" :displayMyAvatar="true"/>
		<MkPageHeader v-else v-model:tab="src" :actions="headerActions" :tabs="$i ? headerTabs : headerTabsWhenNotLogin" :displayMyAvatar="true"/>
	</template>
	<MkSpacer :contentMax="800">
		<MkHorizontalSwipe v-model:tab="src" :tabs="$i ? headerTabs : headerTabsWhenNotLogin">
			<div :key="src" ref="rootEl">
				<MkInfo v-if="isBasicTimeline(src) && !defaultStore.reactiveState.timelineTutorials.value[src]" style="margin-bottom: var(--MI-margin);" closable @close="closeTutorial()">
					{{ i18n.ts._timelineDescription[src] }}
				</MkInfo>
				<MkInfo v-if="schedulePostList > 0" style="margin-bottom: var(--MI-margin);"><button type="button" :class="$style.checkSchedulePostList" @click="os.listScheduleNotePost">{{ i18n.tsx.thereIsSchedulePost({ n: schedulePostList }) }}</button></MkInfo>
				<MkPostForm v-if="defaultStore.reactiveState.showFixedPostForm.value" :class="$style.postForm" class="post-form _panel" fixed style="margin-bottom: var(--MI-margin);" :autofocus="false"/>

				<transition
					:enterActiveClass="defaultStore.state.animation ? $style.transition_new_enterActive : ''"
					:leaveActiveClass="defaultStore.state.animation ? $style.transition_new_leaveActive : ''"
					:enterFromClass="defaultStore.state.animation ? $style.transition_new_enterFrom : ''"
					:leaveToClass="defaultStore.state.animation ? $style.transition_new_leaveTo : ''"
				>
					<div
						v-if="queue > 0 && ['default', 'count'].includes(defaultStore.state.newNoteReceivedNotificationBehavior)"
						:class="[$style.new, { [$style.showEl]: (showEl && ['hideHeaderOnly', 'hideHeaderFloatBtn', 'hide'].includes(<string>defaultStore.state.displayHeaderNavBarWhenScroll)) && isMobile && !isFriendly, [$style.showElTab]: (showEl && ['hideHeaderOnly', 'hideHeaderFloatBtn', 'hide'].includes(<string>defaultStore.state.displayHeaderNavBarWhenScroll)) && isMobile && isFriendly, [$style.reduceAnimation]: !defaultStore.state.animation }]"
					>
						<button class="_buttonPrimary" :class="$style.newButton" @click="top()">
							<i class="ti ti-arrow-up"></i>
							<I18n :src="defaultStore.state.newNoteReceivedNotificationBehavior === 'count' ? i18n.ts.newNoteRecivedCount : defaultStore.state.newNoteReceivedNotificationBehavior === 'default' ? i18n.ts.newNoteRecived : null" textTag="span">
								<template v-if="defaultStore.state.newNoteReceivedNotificationBehavior === 'count'" #n>{{ queue > 19 ? queue + '+' : queue }}</template>
							</I18n>
						</button>
					</div>
				</transition>

				<div :class="$style.tl">
					<div v-if="!isAvailableBasicTimeline(src) && !src.startsWith('list:')" :class="$style.disabled">
						<p :class="$style.disabledTitle">
							<i class="ti ti-circle-minus"></i>
							{{ i18n.ts._disabledTimeline.title }}
						</p>
						<p :class="$style.disabledDescription">{{ i18n.ts._disabledTimeline.description }}</p>
					</div>
					<MkTimeline
						v-else
						ref="tlComponent"
						:key="src + withRenotes + withReplies + withSensitive + onlyFiles + onlyCats"
						:src="src.split(':')[0]"
						:list="src.split(':')[1]"
						:withRenotes="withRenotes"
						:withReplies="withReplies"
						:withSensitive="withSensitive"
						:onlyFiles="onlyFiles"
						:onlyCats="onlyCats"
						:sound="true"
						@queue="queueUpdated"
					/>
				</div>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, provide, shallowRef, ref, onMounted, onActivated } from 'vue';
import { scroll } from '@@/js/scroll.js';
import type { Tab } from '@/components/global/MkPageHeader.tabs.vue';
import type { BasicTimelineType } from '@/timelines.js';
import type { MenuItem } from '@/types/menu.js';
import MkTimeline from '@/components/MkTimeline.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { antennasCache, userListsCache, favoritedChannelsCache } from '@/cache.js';
import { globalEvents } from '@/events.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { deepMerge } from '@/scripts/merge.js';
import { miLocalStorage } from '@/local-storage.js';
import { availableBasicTimelines, hasWithReplies, isAvailableBasicTimeline, isBasicTimeline, basicTimelineIconClass } from '@/timelines.js';
import { reloadAsk } from '@/scripts/reload-ask.js';

const showEl = ref(false);
const isFriendly = ref(miLocalStorage.getItem('ui') === 'friendly');

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 500;

// デスクトップでウィンドウを狭くしたときモバイルUIが表示されて欲しいことはあるので deviceKind === 'desktop' の判定は行わない
const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
const isMobile = ref(['smartphone', 'tablet'].includes(<string>deviceKind) || window.innerWidth <= MOBILE_THRESHOLD);
window.addEventListener('resize', () => {
	isMobile.value = deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD;
});

const schedulePostList = (await misskeyApi('notes/schedule/list')).length;

if (!isFriendly.value) provide('shouldOmitHeaderTitle', true);

const tlComponent = shallowRef<InstanceType<typeof MkTimeline>>();
const rootEl = shallowRef<HTMLElement>();

type TimelinePageSrc = BasicTimelineType | `list:${string}`;

const queue = ref(0);
const srcWhenNotSignin = ref<'local' | 'global'>(isAvailableBasicTimeline('local') ? 'local' : 'global');
const src = computed<TimelinePageSrc>({
	get: () => ($i ? defaultStore.reactiveState.tl.value.src : srcWhenNotSignin.value),
	set: (x) => saveSrc(x),
});
const withRenotes = computed<boolean>({
	get: () => defaultStore.reactiveState.tl.value.filter.withRenotes,
	set: (x) => saveTlFilter('withRenotes', x),
});

// computed内での無限ループを防ぐためのフラグ
const localSocialTLFilterSwitchStore = ref<'withReplies' | 'onlyFiles' | false>(
	defaultStore.reactiveState.tl.value.filter.withReplies ? 'withReplies' :
	defaultStore.reactiveState.tl.value.filter.onlyFiles ? 'onlyFiles' :
	false,
);

const withReplies = computed<boolean>({
	get: () => {
		if (!$i) return false;
		if (['local', 'social'].includes(src.value) && localSocialTLFilterSwitchStore.value === 'onlyFiles') {
			return false;
		} else {
			return defaultStore.reactiveState.tl.value.filter.withReplies;
		}
	},
	set: (x) => saveTlFilter('withReplies', x),
});
const onlyFiles = computed<boolean>({
	get: () => {
		if (['local', 'social'].includes(src.value) && localSocialTLFilterSwitchStore.value === 'withReplies') {
			return false;
		} else {
			return defaultStore.reactiveState.tl.value.filter.onlyFiles;
		}
	},
	set: (x) => saveTlFilter('onlyFiles', x),
});
const onlyCats = computed({
	get: () => defaultStore.reactiveState.tl.value.filter.onlyCats,
	set: (x: boolean) => saveTlFilter('onlyCats', x),
});

watch([withReplies, onlyFiles], ([withRepliesTo, onlyFilesTo]) => {
	if (withRepliesTo) {
		localSocialTLFilterSwitchStore.value = 'withReplies';
	} else if (onlyFilesTo) {
		localSocialTLFilterSwitchStore.value = 'onlyFiles';
	} else {
		localSocialTLFilterSwitchStore.value = false;
	}
});

const withSensitive = computed<boolean>({
	get: () => defaultStore.reactiveState.tl.value.filter.withSensitive,
	set: (x) => saveTlFilter('withSensitive', x),
});

const enableWidgetsArea = ref(defaultStore.state.enableWidgetsArea);
const friendlyUiEnableNotificationsArea = ref(defaultStore.state.friendlyUiEnableNotificationsArea);

const enableHomeTimeline = ref(defaultStore.state.enableHomeTimeline);
const enableLocalTimeline = ref(defaultStore.state.enableLocalTimeline);
const enableSocialTimeline = ref(defaultStore.state.enableSocialTimeline);
const enableGlobalTimeline = ref(defaultStore.state.enableGlobalTimeline);
const enableBubbleTimeline = ref(defaultStore.state.enableBubbleTimeline);
const enableListTimeline = ref(defaultStore.state.enableListTimeline);
const enableAntennaTimeline = ref(defaultStore.state.enableAntennaTimeline);
const enableChannelTimeline = ref(defaultStore.state.enableChannelTimeline);

const forceCollapseAllRenotes = ref(defaultStore.state.forceCollapseAllRenotes);
const collapseRenotes = ref(defaultStore.state.collapseRenotes);
const collapseReplies = ref(defaultStore.state.collapseReplies);
const collapseLongNoteContent = ref(defaultStore.state.collapseLongNoteContent);
const collapseDefault = ref(defaultStore.state.collapseDefault);
const alwaysShowCw = ref(defaultStore.state.alwaysShowCw);
const showReplyTargetNote = ref(defaultStore.state.showReplyTargetNote);

watch(src, () => {
	queue.value = 0;
	queueUpdated(queue.value);
});

watch(enableWidgetsArea, (x) => {
	defaultStore.set('enableWidgetsArea', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(friendlyUiEnableNotificationsArea, (x) => {
	defaultStore.set('friendlyUiEnableNotificationsArea', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableHomeTimeline, (x) => {
	defaultStore.set('enableHomeTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableLocalTimeline, (x) => {
	defaultStore.set('enableLocalTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableSocialTimeline, (x) => {
	defaultStore.set('enableSocialTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableGlobalTimeline, (x) => {
	defaultStore.set('enableGlobalTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableBubbleTimeline, (x) => {
	defaultStore.set('enableBubbleTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableListTimeline, (x) => {
	defaultStore.set('enableListTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableAntennaTimeline, (x) => {
	defaultStore.set('enableAntennaTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(enableChannelTimeline, (x) => {
	defaultStore.set('enableChannelTimeline', x);
	reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch(forceCollapseAllRenotes, (x) => {
	defaultStore.set('forceCollapseAllRenotes', x);
	reloadTimeline();
});

watch(collapseRenotes, (x) => {
	defaultStore.set('collapseRenotes', x);
	reloadTimeline();
});

watch(collapseReplies, (x) => {
	defaultStore.set('collapseReplies', x);
	reloadTimeline();
});

watch(collapseLongNoteContent, (x) => {
	defaultStore.set('collapseLongNoteContent', x);
	reloadTimeline();
	reloadNotification();
});

watch(collapseDefault, (x) => {
	defaultStore.set('collapseDefault', x);
	reloadTimeline();
	reloadNotification();
});

watch(alwaysShowCw, (x) => {
	defaultStore.set('alwaysShowCw', x);
	reloadTimeline();
	reloadNotification();
});

watch(showReplyTargetNote, (x) => {
	defaultStore.set('showReplyTargetNote', x);
	reloadTimeline();
	reloadNotification();
});

onMounted(() => {
	globalEvents.on('showEl', (showEl_receive) => {
		showEl.value = showEl_receive;
	});
});

function queueUpdated(q: number): void {
	queue.value = q;
	globalEvents.emit('queueUpdated', q);
}

function top(): void {
	if (rootEl.value) scroll(rootEl.value, { top: 0 });
}

async function chooseList(ev: MouseEvent): Promise<void> {
	const lists = await userListsCache.fetch();
	const items: MenuItem[] = [
		...lists.map(list => ({
			type: 'link' as const,
			text: list.name,
			to: `/timeline/list/${list.id}`,
		})),
		(lists.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/my/lists',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseAntenna(ev: MouseEvent): Promise<void> {
	const antennas = await antennasCache.fetch();
	const items: MenuItem[] = [
		...antennas.map(antenna => ({
			type: 'link' as const,
			text: antenna.name,
			indicate: antenna.hasUnreadNote,
			to: `/timeline/antenna/${antenna.id}`,
		})),
		(antennas.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link' as const,
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/my/antennas',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

async function chooseChannel(ev: MouseEvent): Promise<void> {
	const channels = await favoritedChannelsCache.fetch();
	const items: MenuItem[] = [
		...channels.map(channel => {
			const lastReadedAt = miLocalStorage.getItemAsJson(`channelLastReadedAt:${channel.id}`) ?? null;
			const hasUnreadNote = (lastReadedAt && channel.lastNotedAt) ? Date.parse(channel.lastNotedAt) > lastReadedAt : !!(!lastReadedAt && channel.lastNotedAt);

			return {
				type: 'link' as const,
				text: channel.name,
				indicate: hasUnreadNote,
				to: `/channels/${channel.id}`,
			};
		}),
		(channels.length === 0 ? undefined : { type: 'divider' }),
		{
			type: 'link',
			icon: 'ti ti-plus',
			text: i18n.ts.createNew,
			to: '/channels',
		},
	];
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

function saveSrc(newSrc: TimelinePageSrc): void {
	const out = deepMerge({ src: newSrc }, defaultStore.state.tl);

	if (defaultStore.state.enableListTimeline && newSrc.startsWith('userList:')) {
		const id = newSrc.substring('userList:'.length);
		out.userList = defaultStore.reactiveState.pinnedUserLists.value.find(l => l.id === id) ?? null;
	}

	defaultStore.set('tl', out);
	if (['local', 'global'].includes(newSrc)) {
		srcWhenNotSignin.value = newSrc as 'local' | 'global';
	}
}

function saveTlFilter(key: keyof typeof defaultStore.state.tl.filter, newValue: boolean) {
	if (key !== 'withReplies' || $i) {
		const out = deepMerge({ filter: { [key]: newValue } }, defaultStore.state.tl);
		defaultStore.set('tl', out);
	}
}

async function timetravel(): Promise<void> {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlComponent.value.timetravel(date);
}

function focus(): void {
	tlComponent.value.focus();
}

function closeTutorial(): void {
	if (!isBasicTimeline(src.value)) return;
	const before = defaultStore.state.timelineTutorials;
	before[src.value] = true;
	defaultStore.set('timelineTutorials', before);
}

function switchTlIfNeeded() {
	if (isBasicTimeline(src.value) && !isAvailableBasicTimeline(src.value)) {
		src.value = availableBasicTimelines()[0];
	}
}

function reloadTimeline() {
	globalEvents.emit('reloadTimeline');
}

function reloadNotification() {
	globalEvents.emit('reloadNotification');
}

onMounted(() => {
	switchTlIfNeeded();
});
onActivated(() => {
	switchTlIfNeeded();
});

const headerActions = computed(() => {
	const tmp = [
		{
			icon: 'ti ti-dots',
			text: i18n.ts.options,
			handler: (ev) => {
				const menuItems: MenuItem[] = [];

				if (isFriendly.value) {
					menuItems.push({
						type: 'parent',
						icon: 'ti ti-settings',
						text: 'Friendly UI',
						children: async () => {
							const friendlyUiChildMenu = [] as MenuItem[];

							if (isDesktop.value) {
								friendlyUiChildMenu.push({
									type: 'switch',
									text: i18n.ts._cherrypick.friendlyUiEnableNotificationsArea,
									ref: friendlyUiEnableNotificationsArea,
								});
							}

							return friendlyUiChildMenu;
						},
					});
				}

				menuItems.push({
					type: 'switch',
					text: i18n.ts._cherrypick.enableWidgetsArea,
					ref: enableWidgetsArea,
				});

				menuItems.push({ type: 'divider' });

				menuItems.push({
					type: 'parent',
					icon: 'ti ti-align-left',
					text: i18n.ts.timeline,
					children: async () => {
						const displayOfTimelineChildMenu = [] as MenuItem[];

						displayOfTimelineChildMenu.push({
							type: 'switch',
							text: i18n.ts._timelines.home,
							icon: 'ti ti-home',
							ref: enableHomeTimeline,
						}, {
							type: 'switch',
							text: i18n.ts._timelines.local,
							icon: 'ti ti-planet',
							ref: enableLocalTimeline,
						}, {
							type: 'switch',
							text: i18n.ts._timelines.social,
							icon: 'ti ti-universe',
							ref: enableSocialTimeline,
						}, {
							type: 'switch',
							text: i18n.ts._timelines.global,
							icon: 'ti ti-world',
							ref: enableGlobalTimeline,
						}, {
							type: 'switch',
							text: i18n.ts._timelines.bubble,
							icon: 'ti ti-droplet',
							ref: enableBubbleTimeline,
						}, { type: 'divider' }, {
							type: 'switch',
							text: i18n.ts.lists,
							icon: 'ti ti-list',
							ref: enableListTimeline,
						}, {
							type: 'switch',
							text: i18n.ts.antennas,
							icon: 'ti ti-antenna',
							ref: enableAntennaTimeline,
						}, {
							type: 'switch',
							text: i18n.ts.channel,
							icon: 'ti ti-device-tv',
							ref: enableChannelTimeline,
						});

						return displayOfTimelineChildMenu;
					},
				});

				menuItems.push({
					type: 'parent',
					icon: 'ti ti-note',
					text: i18n.ts.displayOfNote,
					children: async () => {
						const displayOfNoteChildMenu = [] as MenuItem[];

						displayOfNoteChildMenu.push({
							type: 'switch',
							text: i18n.ts.showRenotes,
							ref: withRenotes,
						});

						if (isBasicTimeline(src.value) && hasWithReplies(src.value)) {
							displayOfNoteChildMenu.push({
								type: 'switch',
								text: i18n.ts.showRepliesToOthersInTimeline,
								ref: withReplies,
								disabled: onlyFiles,
							});
						}

						displayOfNoteChildMenu.push({
							type: 'switch',
							text: i18n.ts.withSensitive,
							ref: withSensitive,
						}, {
							type: 'switch',
							text: i18n.ts.fileAttachedOnly,
							ref: onlyFiles,
							disabled: isBasicTimeline(src.value) && hasWithReplies(src.value) ? withReplies : false,
						}, {
							type: 'switch',
							text: i18n.ts.showCatOnly,
							ref: onlyCats,
						}, { type: 'divider' }, {
							type: 'switch',
							text: i18n.ts.forceCollapseAllRenotes,
							ref: forceCollapseAllRenotes,
						}, {
							type: 'switch',
							text: i18n.ts.collapseRenotes,
							disabled: forceCollapseAllRenotes.value,
							ref: collapseRenotes,
						}, {
							type: 'switch',
							text: i18n.ts.collapseReplies,
							ref: collapseReplies,
						}, {
							type: 'switch',
							text: i18n.ts.collapseLongNoteContent,
							ref: collapseLongNoteContent,
						}, {
							type: 'switch',
							text: i18n.ts.collapseDefault,
							ref: collapseDefault,
						}, {
							type: 'switch',
							text: i18n.ts.alwaysShowCw,
							ref: alwaysShowCw,
						}, {
							type: 'switch',
							text: i18n.ts.showReplyTargetNote,
							ref: showReplyTargetNote,
						});

						return displayOfNoteChildMenu;
					},
				});

				os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
			},
		},
	];
	if (deviceKind === 'desktop') {
		tmp.unshift({
			icon: 'ti ti-refresh',
			text: i18n.ts.reload,
			handler: (ev: Event) => {
				tlComponent.value?.reloadTimeline();
			},
		});
	}
	return tmp;
});

const headerTabs = computed(() => [...(defaultStore.reactiveState.pinnedUserLists.value.map(l => ({
	key: 'list:' + l.id,
	title: l.name,
	icon: 'ti ti-star',
	iconOnly: true,
}))), ...availableBasicTimelines().map(tl => ({
	key: tl,
	title: i18n.ts._timelines[tl],
	icon: basicTimelineIconClass(tl),
	iconOnly: true,
})), ...(defaultStore.state.enableListTimeline ? [{
	icon: 'ti ti-list',
	title: i18n.ts.lists,
	iconOnly: true,
	onClick: chooseList,
}] : []), ...(defaultStore.state.enableAntennaTimeline ? [{
	icon: 'ti ti-antenna',
	title: i18n.ts.antennas,
	iconOnly: true,
	onClick: chooseAntenna,
}] : []), ...(defaultStore.state.enableChannelTimeline ? [{
	icon: 'ti ti-device-tv',
	title: i18n.ts.channel,
	iconOnly: true,
	onClick: chooseChannel,
}] : [])] as Tab[]);

const headerTabsWhenNotLogin = computed(() => [...availableBasicTimelines().map(tl => ({
	key: tl,
	title: i18n.ts._timelines[tl],
	icon: basicTimelineIconClass(tl),
	iconOnly: true,
}))] as Tab[]);

definePageMetadata(() => ({
	title: i18n.ts.timeline,
	icon: isBasicTimeline(src.value) ? basicTimelineIconClass(src.value) : 'ti ti-home',
}));
</script>

<style lang="scss" module>
.transition_new_enterActive,
.transition_new_leaveActive {
	transform: translateY(-64px);
}

.new {
	position: sticky;
	top: calc(var(--MI-stickyTop, 0px) + 8px);
	z-index: 1000;
	width: 100%;
	margin: calc(-0.675em - 8px) 0;
	transition: opacity 0.5s, transform 0.5s;

	&:first-child {
		margin-top: calc(-0.675em - 8px - var(--MI-margin));
	}

	&.showEl {
		transform: translateY(calc(var(--MI-stickyTop, 0px) - 101px))
	}

  &.showElTab {
    transform: translateY(calc(var(--MI-stickyTop, 0px) - 181px))
  }

	&.reduceAnimation {
		transition: opacity 0s, transform 0s;
	}
}

.newButton {
	display: block;
	margin: var(--MI-margin) auto 0 auto;
	padding: 8px 16px;
	border-radius: 32px;

	> i {
		margin-right: 5px;
	}
}

.postForm {
	border-radius: var(--MI-radius);
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.checkSchedulePostList {
	background: none;
	border: none;
	color: inherit;

	&:hover {
		text-decoration: underline;
	}
}
</style>
