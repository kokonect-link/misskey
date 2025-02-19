<!--
SPDX-FileCopyrightText: syuilo and misskey-project & noridev and cherrypick-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA
	class="_panel"
	:class="[$style.message, { [$style.isRead]: (isMe(message) || (message.groupId ? message.reads.includes($i?.id) : message.isRead)) }]"
	:to="message.groupId ? `/my/messaging/group/${ message.groupId }` : `/my/messaging/@${Misskey.acct.toString(isMe(message) ? message.recipient : message.user)}`"
>
	<div>
		<span v-if="!(isMe(message) || (message.groupId ? message.reads.includes($i?.id) : message.isRead))" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
		<MkAvatar :class="$style.avatar" :user="message.groupId ? message.user : isMe(message) ? message.recipient : message.user" indicator link preview/>
		<header v-if="message.groupId">
			<span :class="$style.name">{{ message.group.name }}</span>
			<MkTime :time="message.createdAt" :class="$style.time"/>
		</header>
		<header v-else>
			<div style="display: flex; flex-direction: column; max-width: 90%;">
				<span :class="$style.name"><MkUserName :user="isMe(message) ? message.recipient : message.user"/></span>
				<span :class="$style.username">@{{ Misskey.acct.toString(isMe(message) ? message.recipient : message.user) }}</span>
			</div>
			<MkTime :time="message.createdAt" :class="$style.time"/>
		</header>
		<div>
			<p :class="$style.text">
				<span v-if="isMe(message)" :class="$style.me">{{ i18n.ts.you }}: </span>
				<Mfm v-if="message.text != null && message.text.length > 0" :text="message.text"/>
				<span v-if="message.file?.id.length != undefined"><span v-if="message.text != null && message.text.length > 0" style="margin-right: 5px;"/>📎</span>
			</p>
		</div>
	</div>
</MkA>
</template>

<script lang="ts" setup>
import * as Misskey from 'cherrypick-js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	message: Misskey.entities.MessagingMessage;
}>();

function isMe(message): boolean {
	return message.userId === $i?.id;
}
</script>

<style lang="scss" module>
.message {
  display: block;
  text-decoration: none !important;
  margin-bottom: var(--MI-margin);

  * {
    pointer-events: none;
    user-select: none;
  }

  &:hover {
    .avatar {
      filter: saturate(200%);
    }
  }

  &::after {
    content: "";
    display: block;
    clear: both;
  }

  > div {
    padding: 25px 30px;

    &::after {
      content: "";
      display: block;
      clear: both;
    }

    > header {
      display: flex;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  &.isRead {
    background: var(--MI_THEME-chatReadBg);
  }
}

.indicator {
  position: relative;
  top: 25px;
  left: -12px;
  color: var(--MI_THEME-indicator);
  font-size: 9px;
	float: left;
}

.name {
  margin: 0;
  padding: 0;
  font-weight: bold;
  transition: all 0.1s ease;
	overflow: hidden;
	text-overflow: ellipsis;
}

.username {
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  margin: 0 0 0 auto;
  font-size: .85em;
}

.avatar {
  float: left;
	width: 52px;
	height: 52px;
  margin: 0 16px 0 0;
  border-radius: 8px;
  transition: all 0.1s ease;
}

.text {
  display: -webkit-box;
  margin: 0 0 0 0;
  padding: 0;
  overflow: hidden;
  overflow-wrap: break-word;
  line-height: 1.35;
  max-height: 4.05em;
  color: var(--faceText);
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.me {
  opacity: 0.7;
}

.image {
  display: block;
  max-width: 100%;
  max-height: 512px;
}

@container (max-width: 500px) {
  .message {
    > div {
      padding: 14px 20px;
      font-size: .9em;
    }
  }

  .indicator {
    top: 36px;
    left: 12px;
  }

  .avatar {
    margin: 0 8px;
  }
}
</style>
