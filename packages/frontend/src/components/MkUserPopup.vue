<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="defaultStore.state.animation ? $style.transition_popup_enterActive : ''"
	:leaveActiveClass="defaultStore.state.animation ? $style.transition_popup_leaveActive : ''"
	:enterFromClass="defaultStore.state.animation ? $style.transition_popup_enterFrom : ''"
	:leaveToClass="defaultStore.state.animation ? $style.transition_popup_leaveTo : ''"
	appear @afterLeave="emit('closed')"
>
	<div v-if="showing" :class="[$style.root, { _popup: !defaultStore.state.useBlurEffect || !defaultStore.state.useBlurEffectForModal || !defaultStore.state.removeModalBgColorForBlur, _popupAcrylic: defaultStore.state.useBlurEffect && defaultStore.state.useBlurEffectForModal && defaultStore.state.removeModalBgColorForBlur }]" class="_shadow" :style="{ zIndex, top: top + 'px', left: left + 'px' }" @mouseover="() => { emit('mouseover'); }" @mouseleave="() => { emit('mouseleave'); }">
		<div v-if="user != null">
			<div :class="$style.banner" :style="user.bannerUrl ? `background-image: url(${defaultStore.state.disableShowingAnimatedImages ? getStaticImageUrl(user.bannerUrl) : user.bannerUrl})` : ''">
				<span v-if="$i && $i.id != user.id && user.isFollowed" :class="$style.followed">{{ i18n.ts.followsYou }}</span>
			</div>
			<svg v-if="(!defaultStore.state.setFederationAvatarShape && !defaultStore.state.squareAvatars) || (defaultStore.state.setFederationAvatarShape && !user.setFederationAvatarShape && !defaultStore.state.squareAvatars) || (defaultStore.state.setFederationAvatarShape && user.setFederationAvatarShape && !user.isSquareAvatars)" viewBox="0 0 128 128" :class="$style.avatarBack">
				<g transform="matrix(1.6,0,0,1.6,-38.4,-51.2)">
					<path d="M64,32C81.661,32 96,46.339 96,64C95.891,72.184 104,72 104,72C104,72 74.096,80 64,80C52.755,80 24,72 24,72C24,72 31.854,72.018 32,64C32,46.339 46.339,32 64,32Z" style="fill: var(--MI_THEME-popup);"/>
				</g>
			</svg>
			<MkAvatar :class="$style.avatar" :user="user" indicator/>
			<div :class="$style.title">
				<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
				<div :class="$style.username"><MkAcct :user="user"/></div>
				<div v-if="user.isAdmin || user.isLocked || user.isBot || user.isProxy" style="margin-top: 4px;">
					<span v-if="user.isAdmin" v-tooltip="i18n.ts.administrator" :title="i18n.ts.isAdmin" style="color: var(--MI_THEME-badge);"><i class="ti ti-shield"></i></span>
					<span v-if="user.isLocked" :title="i18n.ts.isLocked"><i class="ti ti-lock"></i></span>
					<span v-if="user.isBot" :title="i18n.ts.isBot"><i class="ti ti-robot"></i></span>
					<span v-if="user.isProxy" v-tooltip="i18n.ts.proxyAccount" :title="i18n.ts.proxyAccount"><i class="ti ti-ghost"></i></span>
				</div>
			</div>
			<div :class="$style.description">
				<Mfm v-if="user.description" :class="$style.mfm" :text="user.description" :author="user"/>
				<div v-else style="opacity: 0.7;">{{ i18n.ts.noAccountDescription }}</div>
			</div>
			<div :class="$style.status">
				<MkA :to="userPage(user)" :class="$style.statusItem">
					<div :class="$style.statusItemLabel">{{ i18n.ts.notes }}</div>
					<b>{{ number(user.notesCount) }}</b>
				</MkA>
				<MkA v-if="isFollowingVisibleForMe(user)" :class="$style.statusItem" :to="userPage(user, 'following')">
					<div :class="$style.statusItemLabel">{{ i18n.ts.following }}</div>
					<b>{{ number(user.followingCount) }}</b>
				</MkA>
				<MkA v-if="isFollowersVisibleForMe(user)" :class="$style.statusItem" :to="userPage(user, 'followers')">
					<div :class="$style.statusItemLabel">{{ i18n.ts.followers }}</div>
					<b>{{ number(user.followersCount) }}</b>
				</MkA>
			</div>
			<button class="_button" :class="[$style.menu, { [$style.isBlocked]: user.isBlocked || user.isBlocking }]" @click="showMenu"><i class="ti ti-dots"></i></button>
			<button v-tooltip="user.notify === 'none' ? i18n.ts.notifyNotes : i18n.ts.unnotifyNotes" class="_button" :class="[$style.notify, { [$style.isBlocked]: user.isBlocked || user.isBlocking }]" @click="toggleNotify"><i :class="user.notify === 'none' ? 'ti ti-bell-plus' : 'ti ti-bell-minus'"></i></button>
			<MkFollowButton v-if="!user.isBlocked && !user.isBlocking" v-model:user="user" :class="$style.follow" mini/>
		</div>
		<div v-else>
			<MkLoading/>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'cherrypick-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { userPage } from '@/filters/user.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { getUserMenu } from '@/scripts/get-user-menu.js';
import number from '@/filters/number.js';
import { i18n } from '@/i18n.js';
import { defaultStore } from '@/store.js';
import { $i } from '@/account.js';
import { isFollowingVisibleForMe, isFollowersVisibleForMe } from '@/scripts/isFfVisibleForMe.js';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';

const props = defineProps<{
	showing: boolean;
	q: string;
	source: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'mouseover'): void;
	(ev: 'mouseleave'): void;
}>();

const zIndex = os.claimZIndex('middle');
const user = ref<Misskey.entities.UserDetailed | null>(null);
const top = ref(0);
const left = ref(0);

function showMenu(ev: MouseEvent) {
	if (user.value == null) return;
	const { menu, cleanup } = getUserMenu(user.value);
	os.popupMenu(menu, ev.currentTarget ?? ev.target).finally(cleanup);
}

async function toggleNotify() {
	os.apiWithDialog('following/update', {
		userId: user.value.id,
		notify: user.value.notify === 'normal' ? 'none' : 'normal',
	}).then(() => {
		user.value.notify = user.value.notify === 'normal' ? 'none' : 'normal';
	});
}

onMounted(() => {
	if (typeof props.q === 'object') {
		user.value = props.q;
	} else {
		const query = props.q.startsWith('@') ?
			Misskey.acct.parse(props.q.substring(1)) :
			{ userId: props.q };

		misskeyApi('users/show', query).then(res => {
			if (!props.showing) return;
			user.value = res;
		});
	}

	const rect = props.source.getBoundingClientRect();
	const x = ((rect.left + (props.source.offsetWidth / 2)) - (300 / 2)) + window.scrollX;
	const y = rect.top + props.source.offsetHeight + window.scrollY;

	top.value = y;
	left.value = x;
});
</script>

<style lang="scss" module>
.transition_popup_enterActive,
.transition_popup_leaveActive {
	transition: opacity 0.15s, transform 0.15s !important;
}
.transition_popup_enterFrom,
.transition_popup_leaveTo {
	opacity: 0;
	transform: scale(0.9);
}

.root {
	position: absolute;
	width: 300px;
	overflow: clip;
	transform-origin: center top;
}

.banner {
	height: 78px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;

	&::after {
		content: "";
		background-image: var(--MI-blur, inherit);
		position: fixed;
		inset: 0;
		background-size: cover;
		background-position: center;
		pointer-events: none;
		opacity: 0.1;
		filter: var(--MI-blur, blur(10px));
	}

}

.followed {
	position: absolute;
	top: 12px;
	left: 12px;
	padding: 4px 8px;
	color: #fff;
	background: rgba(0, 0, 0, 0.7);
	font-size: 0.7em;
	border-radius: 6px;
}

.avatarBack {
	width: 100px;
	position: absolute;
	top: 28px;
	left: 0;
	right: 0;
	margin: 0 auto;
}

.avatar {
	display: block;
	position: absolute;
	top: 38px;
	left: 0;
	right: 0;
	margin: 0 auto;
	z-index: 2;
	width: 58px;
	height: 58px;
	border: solid 4px var(--MI_THEME-popup);
	background: var(--MI_THEME-popup);
}

.title {
	position: relative;
	z-index: 3;
	display: block;
	padding: 8px 26px 16px 26px;
	margin-top: 16px;
	text-align: center;
}

.name {
	display: inline-block;
	font-weight: bold;
	word-break: break-all;
}

.username {
	display: block;
	font-size: 0.8em;
	opacity: 0.7;
}

.description {
	padding: 16px 26px;
	font-size: 0.8em;
	text-align: center;
	border-top: solid 1px var(--MI_THEME-divider);
	border-bottom: solid 1px var(--MI_THEME-divider);
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 5;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.status {
	display: flex;
	padding: 16px 26px 16px 26px;
}

.statusItem {
	display: inline-block;
	width: 33%;
	text-align: center;
	flex: 1;

	&:hover {
		text-decoration: none;
	}
}

.statusItemLabel {
	font-size: 0.7em;
	color: var(--MI_THEME-fgTransparentWeak);
}

.menu,
.notify {
	position: absolute;
	top: 8px;
	right: 80px;
	padding: 6px;
	background: var(--MI_THEME-panel);
	border-radius: 999px;
}

.menu {
	&.isBlocked {
		right: 44px;
	}
}

.notify {
	right: 44px;

	&.isBlocked {
		right: 8px;
	}
}

.follow {
	position: absolute !important;
	top: 8px;
	right: 8px;
}
</style>
