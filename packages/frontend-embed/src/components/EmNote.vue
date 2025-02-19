<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-show="!isDeleted"
	ref="rootEl"
	:class="[$style.root]"
	:tabindex="isDeleted ? '-1' : '0'"
>
	<div v-if="pinned" :class="$style.tip"><i class="ti ti-pin"></i> {{ i18n.ts.pinnedNote }}</div>
	<!--<div v-if="appearNote._prId_" class="tip"><i class="ti ti-speakerphone"></i> {{ i18n.ts.promotion }}<button class="_textButton hide" @click="readPromo()">{{ i18n.ts.hideThisNote }} <i class="ti ti-x"></i></button></div>-->
	<!--<div v-if="appearNote._featuredId_" class="tip"><i class="ti ti-bolt"></i> {{ i18n.ts.featured }}</div>-->
	<div v-if="isRenote" :class="$style.renote">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<EmAvatar :class="$style.renoteAvatar" :user="note.user" link/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<I18n :src="i18n.ts.renotedBy" tag="span" :class="$style.renoteText">
			<template #user>
				<EmA :class="$style.renoteUserName" :to="userPage(note.user)">
					<EmUserName :user="note.user"/>
				</EmA>
			</template>
		</I18n>
		<div :class="$style.renoteInfo">
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.reactionAcceptance != null" style="margin-right: 0.5em;" :class="{ [$style.danger]: ['nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote', 'likeOnly'].includes(<string>note.reactionAcceptance) }" :title="i18n.ts.reactionAcceptance">
				<i v-if="note.reactionAcceptance === 'likeOnlyForRemote'" v-tooltip="i18n.ts.likeOnlyForRemote" class="ti ti-heart-plus"></i>
				<i v-else-if="note.reactionAcceptance === 'nonSensitiveOnly'" v-tooltip="i18n.ts.nonSensitiveOnly" class="ti ti-icons"></i>
				<i v-else-if="note.reactionAcceptance === 'nonSensitiveOnlyForLocalLikeOnlyForRemote'" v-tooltip="i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote" class="ti ti-heart-plus"></i>
				<i v-else-if="note.reactionAcceptance === 'likeOnly'" v-tooltip="i18n.ts.likeOnly" class="ti ti-heart"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
			<span v-if="note.channel" style="margin-left: 0.5em;" :title="note.channel.name"><i class="ti ti-device-tv"></i></span>
			<span :class="$style.renoteTime">
				<button ref="renoteTime" class="_button">
					<i class="ti ti-dots" :class="$style.renoteMenu"></i>
				</button>
				<MkA :to="notePage(note)">
					<EmTime :time="note.createdAt"/>
				</MkA>
			</span>
		</div>
	</div>
	<EmNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<article :class="$style.article">
		<div v-if="appearNote.channel" :class="$style.colorBar" :style="{ background: appearNote.channel.color }"></div>
		<EmAvatar :class="$style.avatar" :user="appearNote.user" link/>
		<div :class="$style.main">
			<EmNoteHeader :note="appearNote" :mini="true"/>
			<div style="container-type: inline-size;">
				<p v-if="appearNote.cw != null" :class="$style.cw">
					<EmMfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :nyaize="'respect'"/>
					<button style="display: block; width: 100%; margin: 4px 0;" class="_buttonGray _buttonRounded" @click="showContent = !showContent">{{ showContent ? i18n.ts._cw.hide : i18n.ts._cw.show }}</button>
				</p>
				<div v-show="appearNote.cw == null || showContent" :class="[{ [$style.contentCollapsed]: collapsed }]">
					<div :class="$style.text">
						<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
						<div v-if="appearNote.replyId" style="margin-bottom: 4px;">
							<EmA :class="$style.replyIcon" :to="`/notes/${appearNote.replyId}`" @click.stop><i class="ti ti-arrow-back-up"></i></EmA>
							<EmA v-user-preview="appearNote.reply.userId" :class="$style.replyToText" :to="userPage(appearNote.reply.user)" @click.stop><span v-html="replyTo"></span></EmA>
						</div>
						<EmMfm
							v-if="appearNote.text"
							:parsedNodes="parsed"
							:text="appearNote.text"
							:author="appearNote.user"
							:nyaize="'respect'"
							:emojiUrls="appearNote.emojis"
							:enableEmojiMenu="!true"
							:enableEmojiMenuReaction="true"
						/>
					</div>
					<div v-if="appearNote.files && appearNote.files.length > 0">
						<EmMediaList :mediaList="appearNote.files" :originalEntityUrl="`${url}/notes/${appearNote.id}`"/>
					</div>
					<EmPoll v-if="appearNote.poll" :noteId="appearNote.id" :poll="appearNote.poll" :readOnly="true" :class="$style.poll"/>
					<div v-if="appearNote.renote" :class="$style.quote"><EmNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
					<button v-if="isLong && collapsed" :class="$style.collapsed" class="_button" @click="collapsed = false">
						<span :class="$style.collapsedLabel">{{ i18n.ts.showMore }}</span>
					</button>
					<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
						<span :class="$style.showLessLabel">{{ i18n.ts.showLess }}</span>
					</button>
				</div>
				<EmA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</EmA>
			</div>
			<EmReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" :note="appearNote" :maxNumber="16">
				<template #more>
					<EmA :to="`/notes/${appearNote.id}/reactions`" :class="[$style.reactionOmitted]">{{ i18n.ts.more }}</EmA>
				</template>
			</EmReactionsViewer>
			<footer :class="$style.footer">
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-arrow-back-up"></i>
					<p v-if="appearNote.repliesCount > 0" :class="$style.footerButtonCount">{{ number(appearNote.repliesCount) }}</p>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-repeat"></i>
					<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ (appearNote.renoteCount) }}</p>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i v-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
					<i v-else class="ti ti-plus"></i>
					<p v-if="(appearNote.reactionAcceptance === 'likeOnly') && appearNote.reactionCount > 0" :class="$style.noteFooterButtonCount">{{ (appearNote.reactionCount) }}</p>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-quote"></i>
				</a>
				<a :href="`/notes/${appearNote.id}`" target="_blank" rel="noopener" :class="[$style.footerButton, $style.footerButtonLink]" class="_button">
					<i class="ti ti-dots"></i>
				</a>
			</footer>
		</div>
	</article>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, shallowRef } from 'vue';
import * as mfm from 'mfc-js';
import * as Misskey from 'cherrypick-js';
import { shouldCollapsed, shouldMfmCollapsed } from '@@/js/collapsed.js';
import { url } from '@@/js/config.js';
import I18n from '@/components/I18n.vue';
import EmNoteSub from '@/components/EmNoteSub.vue';
import EmNoteHeader from '@/components/EmNoteHeader.vue';
import EmNoteSimple from '@/components/EmNoteSimple.vue';
import EmReactionsViewer from '@/components/EmReactionsViewer.vue';
import EmMediaList from '@/components/EmMediaList.vue';
import EmPoll from '@/components/EmPoll.vue';
import EmMfm from '@/components/EmMfm.js';
import EmA from '@/components/EmA.vue';
import EmAvatar from '@/components/EmAvatar.vue';
import EmUserName from '@/components/EmUserName.vue';
import EmTime from '@/components/EmTime.vue';
import { userPage } from '@/utils.js';
import { i18n } from '@/i18n.js';

function getAppearNote(note: Misskey.entities.Note) {
	return Misskey.note.isPureRenote(note) ? note.renote : note;
}

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	pinned?: boolean;
}>(), {
});

const emit = defineEmits<{
	(ev: 'reaction', emoji: string): void;
	(ev: 'removeReaction', emoji: string): void;
}>();

const inChannel = inject('inChannel', null);

const note = ref((props.note));

const isRenote = Misskey.note.isPureRenote(note.value);

const rootEl = shallowRef<HTMLElement>();
const renoteTime = shallowRef<HTMLElement>();
const appearNote = computed(() => getAppearNote(note.value));
const showContent = ref(false);
const parsed = computed(() => appearNote.value.text ? mfm.parse(appearNote.value.text) : null);
const isLong = shouldCollapsed(appearNote.value, []);
const isMFM = shouldMfmCollapsed(appearNote.value);
const collapsed = ref(appearNote.value.cw == null && (isLong || (isMFM)));
const isDeleted = ref(false);

const replyTo = computed(() => {
	const username = appearNote.value.reply.user.username;
	const text = i18n.tsx.replyTo({ user: username });
	const user = `<span style="color: var(--MI_THEME-accent); margin-right: 0.25em;">@${username}</span>`;

	return text.replace(username, user);
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	font-size: 1.05em;
	overflow: clip;
	contain: content;
	content-visibility: auto;
  contain-intrinsic-size: 0 150px;

	&:focus-visible {
		outline: none;

		&::after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 2px var(--MI_THEME-focus);
			border-radius: var(--MI-radius);
			box-sizing: border-box;
		}
	}

	.footer {
		position: relative;
		z-index: 1;
	}

	&:hover > .article > .main > .footer > .footerButton {
		opacity: 1;
	}

	&.showActionsOnlyHover {
		.footer {
			visibility: hidden;
			position: absolute;
			top: 12px;
			right: 12px;
			padding: 0 4px;
			margin-bottom: 0 !important;
			background: var(--MI_THEME-popup);
			border-radius: 8px;
			box-shadow: 0 4px 32px var(--MI_THEME-shadow);
		}

		.footerButton {
			font-size: 90%;

			&:not(:last-child) {
				margin-right: 0;
			}
		}
	}

	&.showActionsOnlyHover:hover {
		.footer {
			visibility: visible;
		}
	}
}

.tip {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 24px;
	font-size: 90%;
	white-space: pre;
	color: #d28a3f;
}

.tip + .article {
	padding-top: 8px;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.renote {
	position: relative;
	display: flex;
	align-items: center;
	padding: 24px 38px 16px;
	line-height: 28px;
	white-space: pre;
	color: var(--MI_THEME-renote);

	& + .article {
		padding-top: 8px;
	}

	> .colorBar {
		height: calc(100% - 6px);
	}
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	background: var(--MI_THEME-panel);
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteUserName {
	font-weight: bold;
	text-decoration: none;

	&:hover {
		color: var(--MI_THEME-renoteHover);
		text-decoration: none;
	}
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renoteMenu {
	margin-right: 4px;
}

.collapsedRenoteTarget {
	display: flex;
	align-items: center;
	line-height: 28px;
	white-space: pre;
	padding: 8px 38px 24px;
}

.collapsedRenoteTargetAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	background: var(--MI_THEME-panel);
}

.collapsedRenoteTargetText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 90%;
	opacity: 0.7;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}
}

.article {
	position: relative;
	padding: 28px 32px;
	-webkit-tap-highlight-color: transparent;
}

.colorBar {
	position: absolute;
	top: 8px;
	left: 8px;
	width: 5px;
	height: calc(100% - 16px);
	border-radius: 999px;
	pointer-events: none;
}

.avatar {
	flex-shrink: 0;
	display: block !important;
	margin: 0 14px 0 0;
	width: 58px;
	height: 58px;
	position: sticky !important;
	top: calc(22px + var(--MI-stickyTop, 0px));
	left: 0;
	background: var(--MI_THEME-panel);
	transition: top 0.5s;
}

.main {
	flex: 1;
	min-width: 0;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--MI-stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--MI_THEME-popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.contentCollapsed {
	position: relative;
	min-height: 4.5em;
	max-height: 9em;
	overflow: clip;
}

.collapsed {
	display: block;
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 2;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));

	&:hover > .collapsedLabel {
		background: var(--MI_THEME-panelHighlight);
	}
}

.collapsedLabel {
	display: inline-block;
	background: var(--MI_THEME-panel);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}

.text {
	overflow-wrap: break-word;
}

.replyIcon {
	color: var(--MI_THEME-accent);
	margin-right: 0.5em;

	&:hover {
		text-decoration: none;
	}
}

.replyToText {
	&:hover {
		text-decoration: none;
	}
}

.translation {
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: 12px;
	margin-top: 8px;
}

.urlPreview {
	margin-top: 8px;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 24px;
	border: solid 1px var(--MI_THEME-renote);
	border-radius: 8px;
	overflow: clip;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.footer {
	margin: 7px 0 -14px;
}

.footerButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 10px;
	}

	&:hover {
		color: var(--MI_THEME-fgHighlighted);
	}
}

.footerButtonLink:hover,
.footerButtonLink:focus,
.footerButtonLink:active {
	text-decoration: none;
}

.footerButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;
}

@container (max-width: 580px) {
	.root {
		font-size: 0.95em;
	}

	.renote {
		padding: 24px 28px 16px;
	}

	.collapsedRenoteTarget {
		padding: 8px 28px 24px;
	}

	.article {
		padding: 24px 26px;
	}

	.avatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}

	.article {
		padding: 23px 25px;
	}

	.footer {
		margin-bottom: -8px;
	}
}

@container (max-width: 480px) {
	.renote {
		padding: 20px 24px 8px;
	}

	.tip {
		padding: 20px 24px 8px;
	}

	.collapsedRenoteTarget {
		padding: 8px 24px 20px;
		margin-top: 4px;
	}

	.article {
		padding: 22px 24px;
	}
}

@container (max-width: 450px) {
	.avatar {
		margin: 0 10px 0 0;
		width: 46px;
		height: 46px;
		top: calc(14px + var(--MI-stickyTop, 0px));
	}
}

@container (max-width: 400px) {
	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 18px;
			}
		}
	}
}

@container (max-width: 350px) {
	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 12px;
			}
		}
	}

	.colorBar {
		top: 6px;
		left: 6px;
		width: 4px;
		height: calc(100% - 12px);
	}
}

@container (max-width: 300px) {
	.avatar {
		width: 44px;
		height: 44px;
	}

	.root:not(.showActionsOnlyHover) {
		.footerButton {
			&:not(:last-child) {
				margin-right: 8px;
			}
		}
	}
}

@container (max-width: 250px) {
	.quoteNote {
		padding: 12px;
	}
}

.reactionOmitted {
	display: inline-block;
	margin-left: 8px;
	opacity: .8;
	font-size: 95%;
}
</style>
