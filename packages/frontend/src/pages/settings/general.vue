<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="lang">
		<template #label>{{ i18n.ts.uiLanguage }}</template>
		<option v-for="x in langs" :key="x[0]" :value="x[0]">{{ x[1] }}</option>
		<template #caption>
			<I18n :src="i18n.ts.i18nInfo" tag="span">
				<template #link>
					<MkLink url="https://crowdin.com/project/misskey">Crowdin</MkLink>
				</template>
			</I18n>
		</template>
	</MkSelect>

	<MkRadios v-model="overridedDeviceKind">
		<template #label>{{ i18n.ts.overridedDeviceKind }}</template>
		<option :value="null">{{ i18n.ts.auto }}</option>
		<option value="smartphone"><i class="ti ti-device-mobile"/> {{ i18n.ts.smartphone }}</option>
		<option value="tablet"><i class="ti ti-device-tablet"/> {{ i18n.ts.tablet }}</option>
		<option value="desktop"><i class="ti ti-device-desktop"/> {{ i18n.ts.desktop }}</option>
	</MkRadios>

	<FormSection>
		<div class="_gaps_s">
			<MkSwitch v-model="showFixedPostForm">{{ i18n.ts.showFixedPostForm }}</MkSwitch>
			<MkSwitch v-model="showFixedPostFormInChannel">{{ i18n.ts.showFixedPostFormInChannel }}</MkSwitch>
			<MkFolder>
				<template #label>{{ i18n.ts.pinnedList }}</template>
				<!-- 複数ピン止め管理できるようにしたいけどめんどいので一旦ひとつのみ -->
				<MkButton v-if="defaultStore.reactiveState.pinnedUserLists.value.length === 0" @click="setPinnedList()">{{ i18n.ts.add }}</MkButton>
				<MkButton v-else danger @click="removePinnedList()"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.behavior }}</template>

		<div class="_gaps_m">
			<div class="_gaps_s">
				<MkSwitch v-model="imageNewTab">{{ i18n.ts.openImageInNewTab }}</MkSwitch>
				<MkSwitch v-model="useReactionPickerForContextMenu">{{ i18n.ts.useReactionPickerForContextMenu }}</MkSwitch>
				<MkSwitch v-model="enableInfiniteScroll">{{ i18n.ts.enableInfiniteScroll }}</MkSwitch>
				<MkSwitch v-model="keepScreenOn">{{ i18n.ts.keepScreenOn }}</MkSwitch>
				<MkSwitch v-model="disableStreamingTimeline">{{ i18n.ts.disableStreamingTimeline }}</MkSwitch>
				<MkSwitch v-model="enableHorizontalSwipe">{{ i18n.ts.enableHorizontalSwipe }}</MkSwitch>
				<MkSwitch v-model="alwaysConfirmFollow">{{ i18n.ts.alwaysConfirmFollow }}</MkSwitch>
				<MkSwitch v-model="confirmWhenRevealingSensitiveMedia">{{ i18n.ts.confirmWhenRevealingSensitiveMedia }}</MkSwitch>
				<MkSwitch v-model="confirmOnReact">{{ i18n.ts.confirmOnReact }}</MkSwitch>
				<MkSwitch v-model="autoLoadMoreReplies">{{ i18n.ts.autoLoadMoreReplies }} <span class="_beta">CherryPick</span></MkSwitch>
				<MkSwitch v-model="autoLoadMoreConversation">{{ i18n.ts.autoLoadMoreConversation }} <span class="_beta">CherryPick</span></MkSwitch>
				<MkSwitch v-model="useAutoTranslate" @update:modelValue="learnMoreAutoTranslate">
					{{ i18n.ts.useAutoTranslate }} <span class="_beta">CherryPick</span>
					<template v-if="!$i?.policies.canUseAutoTranslate" #caption>{{ i18n.ts.cannotBeUsedFunc }} <a class="_link" @click="learnMoreCantUseAutoTranslate">{{ i18n.ts.learnMore }}</a></template>
				</MkSwitch>
				<MkSwitch v-model="welcomeBackToast">{{ i18n.ts.welcomeBackToast }} <span class="_beta">CherryPick</span></MkSwitch>
				<MkSwitch v-model="disableNyaize">{{ i18n.ts.noNyaization }} <span class="_beta">CherryPick</span></MkSwitch>
			</div>
			<MkSelect v-model="serverDisconnectedBehavior">
				<template #label>{{ i18n.ts.whenServerDisconnected }} <span class="_beta" style="vertical-align: middle;">CherryPick</span></template>
				<option value="reload">{{ i18n.ts._serverDisconnectedBehavior.reload }}</option>
				<option value="dialog">{{ i18n.ts._serverDisconnectedBehavior.dialog }}</option>
				<option value="quiet">{{ i18n.ts._serverDisconnectedBehavior.quiet }}</option>
				<option value="none">{{ i18n.ts._serverDisconnectedBehavior.none }}</option>
			</MkSelect>
			<MkSelect v-model="requireRefreshBehavior">
				<template #label>{{ i18n.ts.requireRefresh }} <span class="_beta" style="vertical-align: middle;">CherryPick</span></template>
				<option value="dialog">{{ i18n.ts._requireRefreshBehavior.dialog }}</option>
				<option value="quiet">{{ i18n.ts._requireRefreshBehavior.quiet }}</option>
			</MkSelect>
			<MkSelect v-model="newNoteReceivedNotificationBehavior">
				<template #label>{{ i18n.ts.newNoteReceivedNotification }} <span class="_beta" style="vertical-align: middle;">CherryPick</span></template>
				<option value="default">{{ i18n.ts._newNoteReceivedNotificationBehavior.default }}</option>
				<option value="count">{{ i18n.ts._newNoteReceivedNotificationBehavior.count }}</option>
				<option value="none">{{ i18n.ts._newNoteReceivedNotificationBehavior.none }}</option>
			</MkSelect>
			<MkSelect v-model="contextMenu">
				<template #label>{{ i18n.ts._contextMenu.title }}</template>
				<option value="app">{{ i18n.ts._contextMenu.app }}</option>
				<option value="appWithShift">{{ i18n.ts._contextMenu.appWithShift }}</option>
				<option value="native">{{ i18n.ts._contextMenu.native }}</option>
			</MkSelect>
			<MkRange v-model="numberOfPageCache" :min="1" :max="10" :step="1" easing>
				<template #label>{{ i18n.ts.numberOfPageCache }}</template>
				<template #caption>{{ i18n.ts.numberOfPageCacheDescription }}</template>
			</MkRange>

			<MkFolder>
				<template #label>{{ i18n.ts.dataSaver }}</template>

				<div class="_gaps_m">
					<MkInfo>{{ i18n.ts.reloadRequiredToApplySettings }}</MkInfo>

					<div class="_buttons">
						<MkButton inline @click="enableAllDataSaver">{{ i18n.ts.enableAll }}</MkButton>
						<MkButton inline @click="disableAllDataSaver">{{ i18n.ts.disableAll }}</MkButton>
					</div>
					<div class="_gaps_m">
						<MkSwitch v-model="dataSaver.media">
							{{ i18n.ts._dataSaver._media.title }}
							<template #caption>{{ i18n.ts._dataSaver._media.description }}</template>
						</MkSwitch>
						<MkSwitch v-model="dataSaver.avatar">
							{{ i18n.ts._dataSaver._avatar.title }}
							<template #caption>{{ i18n.ts._dataSaver._avatar.description }}</template>
						</MkSwitch>
						<MkSwitch v-model="dataSaver.urlPreview">
							{{ i18n.ts._dataSaver._urlPreview.title }}
							<template #caption>{{ i18n.ts._dataSaver._urlPreview.description }}</template>
						</MkSwitch>
						<MkSwitch v-model="dataSaver.code">
							{{ i18n.ts._dataSaver._code.title }}
							<template #caption>{{ i18n.ts._dataSaver._code.description }}</template>
						</MkSwitch>
					</div>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts._externalNavigationWarning.externalNavigationWarning }}</template>

				<div class="_gaps_m">
					<div class="_gaps_m">
						<MkSwitch v-model="externalNavigationWarning">
							{{ i18n.ts._externalNavigationWarning.enableExternalNavigationWarning }}
						</MkSwitch>
						<MkTextarea v-model="trustedDomains">
							<template #label>{{ i18n.ts._externalNavigationWarning.trustedDomainList }}</template>
							<template #caption><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.ts._externalNavigationWarning.trustedDomainListDescription }}<br>{{ i18n.ts._externalNavigationWarning.trustedDomainListDescription2 }}</template>
						</MkTextarea>
						<div class="_buttons">
							<MkButton primary :disabled="!trustedDomainsChanged" @click="trustedDomainsSave()"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
							<MkButton :disabled="!defaultStore.reactiveState.trustedDomains.value.length" danger @click="removeTrustedDomains"><i class="ti ti-trash"></i> {{ i18n.ts._externalNavigationWarning.deleteTrustedDomainList }}</MkButton>
						</div>
					</div>
				</div>
			</MkFolder>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.other }}</template>

		<div class="_gaps">
			<MkRadios v-model="hemisphere">
				<template #label>{{ i18n.ts.hemisphere }}</template>
				<option value="N">{{ i18n.ts._hemisphere.N }}</option>
				<option value="S">{{ i18n.ts._hemisphere.S }}</option>
				<template #caption>{{ i18n.ts._hemisphere.caption }}</template>
			</MkRadios>
			<MkSelect v-model="searchEngine">
				<template #label>{{ i18n.ts._searchSite.title }}</template>
				<template #caption>{{ i18n.ts._searchSite.description }}</template>
				<option value="google">Google</option>
				<option value="bing">Bing</option>
				<option value="yahoo">Yahoo</option>
				<option value="baidu">Baidu</option>
				<option value="naver">NAVER</option>
				<option value="daum">Daum</option>
				<option value="duckduckgo">DuckDuckGo</option>
				<option value="other">{{ i18n.ts.other }}</option>
			</MkSelect>
			<MkInput v-if="defaultStore.state.searchEngine == 'other'" v-model="searchEngineUrl">
				<template #label>{{ i18n.ts._searchSite.otherSearchEngine }}</template>
				<template #caption>{{ i18n.ts._searchSite.otherDescription }}</template>
			</MkInput>
			<MkInput v-if="defaultStore.state.searchEngine == 'other'" v-model="searchEngineUrlQuery">
				<template #label>{{ i18n.ts._searchSite.query }}</template>
				<template #caption>{{ i18n.ts._searchSite.queryDescription }}</template>
			</MkInput>
			<MkFolder>
				<template #label>{{ i18n.ts.additionalEmojiDictionary }}</template>
				<div class="_buttons">
					<template v-for="lang in emojiIndexLangs" :key="lang">
						<MkButton v-if="defaultStore.reactiveState.additionalUnicodeEmojiIndexes.value[lang]" danger @click="removeEmojiIndex(lang)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }} ({{ getEmojiIndexLangName(lang) }})</MkButton>
						<MkButton v-else @click="downloadEmojiIndex(lang)"><i class="ti ti-download"></i> {{ getEmojiIndexLangName(lang) }}{{ defaultStore.reactiveState.additionalUnicodeEmojiIndexes.value[lang] ? ` (${ i18n.ts.installed })` : '' }}</MkButton>
					</template>
				</div>
			</MkFolder>
			<FormLink to="/settings/deck">{{ i18n.ts.deck }}</FormLink>
			<FormLink to="/settings/custom-css"><template #icon><i class="ti ti-code"></i></template>{{ i18n.ts.customCss }}</FormLink>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { langs } from '@@/js/config.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkRange from '@/components/MkRange.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInput from '@/components/MkInput.vue';
import { defaultStore } from '@/store.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { miLocalStorage } from '@/local-storage.js';
import { globalEvents } from '@/events.js';
import { $i } from '@/account.js';

const lang = ref(miLocalStorage.getItem('lang'));
const dataSaver = ref(defaultStore.state.dataSaver);
const trustedDomains = ref(defaultStore.state.trustedDomains.join('\n'));

function reloadTimeline() {
	globalEvents.emit('reloadTimeline');
}

const hemisphere = computed(defaultStore.makeGetterSetter('hemisphere'));
const overridedDeviceKind = computed(defaultStore.makeGetterSetter('overridedDeviceKind'));
const serverDisconnectedBehavior = computed(defaultStore.makeGetterSetter('serverDisconnectedBehavior'));
const imageNewTab = computed(defaultStore.makeGetterSetter('imageNewTab'));
const showFixedPostForm = computed(defaultStore.makeGetterSetter('showFixedPostForm'));
const showFixedPostFormInChannel = computed(defaultStore.makeGetterSetter('showFixedPostFormInChannel'));
const numberOfPageCache = computed(defaultStore.makeGetterSetter('numberOfPageCache'));
const enableInfiniteScroll = computed(defaultStore.makeGetterSetter('enableInfiniteScroll'));
const useReactionPickerForContextMenu = computed(defaultStore.makeGetterSetter('useReactionPickerForContextMenu'));
const keepScreenOn = computed(defaultStore.makeGetterSetter('keepScreenOn'));
const disableStreamingTimeline = computed(defaultStore.makeGetterSetter('disableStreamingTimeline'));
const enableHorizontalSwipe = computed(defaultStore.makeGetterSetter('enableHorizontalSwipe'));
const alwaysConfirmFollow = computed(defaultStore.makeGetterSetter('alwaysConfirmFollow'));
const confirmWhenRevealingSensitiveMedia = computed(defaultStore.makeGetterSetter('confirmWhenRevealingSensitiveMedia'));
const confirmOnReact = computed(defaultStore.makeGetterSetter('confirmOnReact'));
const contextMenu = computed(defaultStore.makeGetterSetter('contextMenu'));
const newNoteReceivedNotificationBehavior = computed(defaultStore.makeGetterSetter('newNoteReceivedNotificationBehavior'));
const requireRefreshBehavior = computed(defaultStore.makeGetterSetter('requireRefreshBehavior'));
const autoLoadMoreReplies = computed(defaultStore.makeGetterSetter('autoLoadMoreReplies'));
const autoLoadMoreConversation = computed(defaultStore.makeGetterSetter('autoLoadMoreConversation'));
const useAutoTranslate = computed(defaultStore.makeGetterSetter('useAutoTranslate'));
const welcomeBackToast = computed(defaultStore.makeGetterSetter('welcomeBackToast'));
const disableNyaize = computed(defaultStore.makeGetterSetter('disableNyaize'));
const externalNavigationWarning = computed(defaultStore.makeGetterSetter('externalNavigationWarning'));
const searchEngine = computed(defaultStore.makeGetterSetter('searchEngine'));
const searchEngineUrl = computed(defaultStore.makeGetterSetter('searchEngineUrl'));
const searchEngineUrlQuery = computed(defaultStore.makeGetterSetter('searchEngineUrlQuery'));

watch(lang, () => {
	miLocalStorage.setItem('lang', lang.value as string);
	miLocalStorage.removeItem('locale');
	miLocalStorage.removeItem('localeVersion');
});

watch([
	hemisphere,
	lang,
	overridedDeviceKind,
	keepScreenOn,
	disableStreamingTimeline,
	alwaysConfirmFollow,
	confirmWhenRevealingSensitiveMedia,
	contextMenu,
], async () => {
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

watch([
	enableInfiniteScroll,
	useAutoTranslate,
	disableNyaize,
], () => {
	reloadTimeline();
});

const emojiIndexLangs = ['en-US', 'ja-JP', 'ja-JP_hira'] as const;

function getEmojiIndexLangName(targetLang: typeof emojiIndexLangs[number]) {
	if (langs.find(x => x[0] === targetLang)) {
		return langs.find(x => x[0] === targetLang)![1];
	} else {
		// 絵文字辞書限定の言語定義
		switch (targetLang) {
			case 'ja-JP_hira': return 'ひらがな';
			default: return targetLang;
		}
	}
}

function downloadEmojiIndex(lang: typeof emojiIndexLangs[number]) {
	async function main() {
		const currentIndexes = defaultStore.state.additionalUnicodeEmojiIndexes;

		function download() {
			switch (lang) {
				case 'en-US': return import('../../unicode-emoji-indexes/en-US.json').then(x => x.default);
				case 'ja-JP': return import('../../unicode-emoji-indexes/ja-JP.json').then(x => x.default);
				case 'ja-JP_hira': return import('../../unicode-emoji-indexes/ja-JP_hira.json').then(x => x.default);
				default: throw new Error('unrecognized lang: ' + lang);
			}
		}

		currentIndexes[lang] = await download();
		await defaultStore.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

function removeEmojiIndex(lang: string) {
	async function main() {
		const currentIndexes = defaultStore.state.additionalUnicodeEmojiIndexes;
		delete currentIndexes[lang];
		await defaultStore.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

async function setPinnedList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: list } = await os.select({
		title: i18n.ts.selectList,
		items: lists.map(x => ({
			value: x, text: x.name,
		})),
	});
	if (canceled) return;

	defaultStore.set('pinnedUserLists', [list]);
}

function removePinnedList() {
	defaultStore.set('pinnedUserLists', []);
}

function enableAllDataSaver() {
	const g = { ...defaultStore.state.dataSaver };
	Object.keys(g).forEach((key) => { g[key] = true; });
	dataSaver.value = g;
}

function disableAllDataSaver() {
	const g = { ...defaultStore.state.dataSaver };
	Object.keys(g).forEach((key) => { g[key] = false; });
	dataSaver.value = g;
}

async function learnMoreAutoTranslate() {
	if (!useAutoTranslate.value) return;

	const confirm = await os.confirm({
		type: 'warning',
		title: i18n.ts.useAutoTranslate,
		text: i18n.ts.useAutoTranslateDescription,
	});
	if (confirm.canceled) useAutoTranslate.value = false;
}

function learnMoreCantUseAutoTranslate() {
	os.alert({
		type: 'info',
		title: i18n.ts.useAutoTranslate,
		text: i18n.tsx.cantUseThisFunctionDescription({ name: i18n.ts.useAutoTranslate }),
		caption: i18n.tsx.cantUseThisFunctionCaption({ name: i18n.ts.useAutoTranslate }),
	});
}

function removeTrustedDomains() {
	async function main() {
		await defaultStore.set('trustedDomains', []);

		// Refresh filtered list to signal to the user how they've been saved
		trustedDomains.value = '';
	}

	os.promiseDialog(main());
}

const trustedDomainsChanged = ref(false);

async function trustedDomainsSave() {
	async function main() {
		let domains = trustedDomains.value
			.trim().split('\n')
			.map(el => el.trim())
			.filter(el => el);

		await defaultStore.set('trustedDomains', domains);

		trustedDomainsChanged.value = false;

		// Refresh filtered list to signal to the user how they've been saved
		trustedDomains.value = domains.join('\n');
	}

	await os.promiseDialog(main());
}

watch(dataSaver, (to) => {
	defaultStore.set('dataSaver', to);
}, {
	deep: true,
});

watch(trustedDomains, () => {
	trustedDomainsChanged.value = true;
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-adjustments',
}));
</script>
