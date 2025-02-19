<!--
SPDX-FileCopyrightText: syuilo and misskey-project & noridev and cherrypick-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<div
		ref="rootEl"
		:class="$style.root"
		@dragover.prevent.stop="onDragover"
		@drop.prevent.stop="onDrop"
	>
		<MkSpacer :contentMax="800">
			<div :class="$style.body">
				<MkPagination v-if="pagination" ref="pagingComponent" :key="userAcct || groupId" :pagination="pagination">
					<template #default="{ items: messages, fetching: pFetching }">
						<MkDateSeparatedList
							v-if="messages.length > 0"
							v-slot="{ item: message }"
							:class="{ [$style.messages]: true, 'deny-move-transition': pFetching }"
							:items="messages"
							:direction="'up'"
							:reversed="true"
						>
							<XMessage :key="message.id" :message="message" :isGroup="group != null"/>
						</MkDateSeparatedList>
					</template>
				</MkPagination>
			</div>
		</MkSpacer>
		<footer>
			<div :class="$style.footerSpacer">
				<div :class="[$style.footer, { [$style.friendly]: isFriendly }]">
					<div v-if="typers.length > 0" :class="$style.typers">
						<I18n :src="i18n.ts.typingUsers" textTag="span">
							<template #users>
								<b v-for="typer in typers" :key="typer.id" :class="$style.user">{{ typer.username }}</b>
							</template>
						</I18n>
						<MkEllipsis/>
					</div>
					<Transition :name="animation ? 'fade' : ''">
						<div v-show="showIndicator" :class="$style.newMessage">
							<button class="_buttonPrimary" :class="$style.newMessageButton" @click="onIndicatorClick">
								<i class="ti ti-circle-arrow-down-filled" :class="$style.newMessageIcon"></i>{{ i18n.ts.newMessageExists }}
							</button>
						</div>
					</Transition>
					<XForm v-if="!fetching" ref="formEl" :user="user" :group="group" :class="$style.form"/>
				</div>
			</div>
		</footer>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted, nextTick, onBeforeUnmount, watch, shallowRef, ref } from 'vue';
import * as Misskey from 'cherrypick-js';
import { isBottomVisible, onScrollBottom, scrollToBottom } from '@@/js/scroll.js';
import XMessage from './messaging-room.message.vue';
import XForm from './messaging-room.form.vue';
import type { Paging } from '@/components/MkPagination.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import * as sound from '@/scripts/sound.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { vibrate } from '@/scripts/vibrate.js';
import { miLocalStorage } from '@/local-storage.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const isFriendly = ref(miLocalStorage.getItem('ui') === 'friendly');

const props = defineProps<{
	userAcct?: string;
	groupId?: string;
}>();

const rootEl = shallowRef<HTMLDivElement>();
const formEl = shallowRef<InstanceType<typeof XForm>>();
const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();

const fetching = ref(true);
const user = ref<Misskey.entities.UserDetailed | null>(null);
const group = ref<Misskey.entities.UserGroup | null>(null);
const typers = ref<Misskey.entities.User[]>([]);
const connection = ref<Misskey.ChannelConnection<Misskey.Channels['messaging']> | null>(null);
const showIndicator = ref(false);
const animation = defaultStore.reactiveState;

const pagination = ref<Paging | null>(null);

watch([() => props.userAcct, () => props.groupId], () => {
	if (connection.value) connection.value.dispose();
	fetch();
});

async function fetch() {
	fetching.value = true;

	if (props.userAcct) {
		const acct = Misskey.acct.parse(props.userAcct);
		user.value = await misskeyApi('users/show', { username: acct.username, host: acct.host || undefined });
		group.value = null;

		pagination.value = {
			endpoint: 'messaging/messages' as const,
			limit: 20,
			params: {
				userId: user.value.id,
			},
			reversed: true,
			isMessaging: true,
			pageEl: rootEl.value,
		};
		connection.value = useStream().useChannel('messaging', {
			otherparty: user.value.id,
		});
	} else {
		user.value = null;
		group.value = await misskeyApi('users/groups/show', { groupId: props.groupId });

		pagination.value = {
			endpoint: 'messaging/messages' as const,
			limit: 20,
			params: {
				groupId: group.value.id,
			},
			reversed: true,
			isMessaging: true,
			pageEl: rootEl.value,
		};
		connection.value = useStream().useChannel('messaging', {
			group: group.value.id,
		});
	}

	connection.value.on('message', onMessage);
	connection.value.on('read', onRead);
	connection.value.on('deleted', onDeleted);
	connection.value.on('typers', _typers => {
		typers.value = _typers.filter(u => u.id !== $i?.id);
	});

	document.addEventListener('visibilitychange', onVisibilitychange);

	nextTick(() => {
		thisScrollToBottom();
		window.setTimeout(() => {
			fetching.value = false;
		}, 300);
	});
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;

	if (isFile || isDriveFile) {
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}
}

function onDrop(ev: DragEvent): void {
	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length === 1) {
		formEl.value.upload(ev.dataTransfer.files[0]);
		return;
	} else if (ev.dataTransfer.files.length > 1) {
		os.alert({
			type: 'error',
			text: i18n.ts.onlyOneFileCanBeAttached,
		});
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		formEl.value.file = JSON.parse(driveFile);
	}
	//#endregion
}

function onMessage(message) {
	sound.playMisskeySfx('chat');
	vibrate(defaultStore.state.vibrateChat ? [30, 30, 30] : []);

	const _isBottom = isBottomVisible(rootEl.value, 64);

	pagingComponent.value.prepend(message);
	if (message.userId !== $i?.id && !document.hidden) {
		connection.value?.send('read', {
			id: message.id,
		});
	}

	if (_isBottom) {
		// Scroll to bottom
		nextTick(() => {
			thisScrollToBottom();
		});
	} else if (message.userId !== $i?.id) {
		// Notify
		notifyNewMessage();
	}
}

function onRead(x) {
	if (user.value) {
		if (!Array.isArray(x)) x = [x];
		for (const id of x) {
			if (pagingComponent.value.items.some(y => y.id === id)) {
				const exist = pagingComponent.value.items.map(y => y.id).indexOf(id);
				pagingComponent.value.items[exist] = {
					...pagingComponent.value.items[exist],
					isRead: true,
				};
			}
		}
	} else if (group.value) {
		for (const id of x.ids) {
			if (pagingComponent.value.items.some(y => y.id === id)) {
				const exist = pagingComponent.value.items.map(y => y.id).indexOf(id);
				pagingComponent.value.items[exist] = {
					...pagingComponent.value.items[exist],
					reads: [...pagingComponent.value.items[exist].reads, x.userId],
				};
			}
		}
	}
}

function onDeleted(id) {
	pagingComponent.value.items.delete(id);
}

function thisScrollToBottom() {
	if (window.location.href.includes('my/messaging/')) {
		scrollToBottom(rootEl.value, { behavior: 'smooth' });
	}
}

function onIndicatorClick() {
	showIndicator.value = false;
	thisScrollToBottom();
}

const scrollRemove = ref<(() => void) | null>(null);

function notifyNewMessage() {
	showIndicator.value = true;

	scrollRemove.value = onScrollBottom(rootEl.value, () => {
		showIndicator.value = false;
		scrollRemove.value = null;
	});
}

function onVisibilitychange() {
	if (document.hidden) return;
	for (const message of pagingComponent.value.items) {
		if (message.userId !== $i?.id && !message.isRead) {
			connection.value?.send('read', {
				id: message.id,
			});
		}
	}
}

onMounted(() => {
	fetch();
});

onBeforeUnmount(() => {
	connection.value?.dispose();
	document.removeEventListener('visibilitychange', onVisibilitychange);
	if (scrollRemove.value) scrollRemove.value();
});

definePageMetadata(computed(() => !fetching.value ? user.value ? {
	title: '',
	icon: null,
	userName: user,
	avatar: user,
} : {
	title: group.value?.name,
	icon: 'ti ti-users',
} : null));
</script>

<style lang="scss" module>
.fade-enter-active, .fade-leave-active {
	transition: opacity 0.1s;
}

.fade-enter-from, .fade-leave-to {
	transition: opacity 0.5s;
	opacity: 0;
}

.body {
	min-height: 80dvh;
}

.more {
	display: block;
	margin: 16px auto;
	padding: 0 12px;
	line-height: 24px;
	color: #fff;
	background: rgba(#000, 0.3);
	border-radius: 12px;

	&:hover {
		background: rgba(#000, 0.4);
	}

	&:active {
		background: rgba(#000, 0.5);
	}

	> i {
		margin-right: 4px;
	}
}

.fetching {
	cursor: wait;
}

.messages {
	padding: 16px 0 0;

	> * {
		margin-bottom: 16px;
	}
}

.footerSpacer {
	padding: 20px;
}

.footer {
	width: 100%;
	position: sticky;
	z-index: 2;
	padding-top: 8px;
}

.newMessage {
	width: 100%;
	padding-bottom: 8px;
	text-align: center;
}

.newMessageButton {
	display: inline-block;
	margin: 0;
	padding: 0 12px;
	line-height: 32px;
	font-size: 12px;
	border-radius: 16px;
}

.newMessageIcon {
	display: inline-block;
	margin-right: 8px;
}

.typers {
	position: absolute;
	bottom: 100%;
	padding: 0 8px 0 8px;
	font-size: 0.9em;
	color: var(--MI_THEME-fgTransparentWeak);
}

.user + .user:before {
	content: ", ";
	font-weight: normal;
}

.user:last-of-type:after {
	content: " ";
}

.form {
	max-height: 12em;
	overflow-y: scroll;
	// border-top: solid 0.5px var(--MI_THEME-divider);
	// border-bottom-left-radius: 0;
	// border-bottom-right-radius: 0;
	border-radius: 15px;
}

@container (max-width: 500px) {
	.footerSpacer {
		padding: initial;
	}

	.footer {
		&.friendly {
			margin-bottom: calc(50px + env(safe-area-inset-bottom));
		}
	}

	.form {
		border-radius: 0;
	}
}
</style>
