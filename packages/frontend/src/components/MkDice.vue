<template>
<div :class="$style.root">
	<div>
		<MkInput v-model="diceCount" small type="text" :class="$style.input">
			<template #label>{{ i18n.ts._dice.diceCount }}</template>
		</MkInput>
	</div>
	<div>
		<MkInput v-model="diceFaces" small type="text" :class="$style.input">
			<template #label>{{ i18n.ts._dice.diceFaces }}</template>
		</MkInput>
	</div>
	<div>
		<MkButton large primary style="margin: 0 auto;" @click="rollDice">
			<i class="ti ti-dice-2"></i>
			{{ i18n.ts._dice.rollDice }}
		</MkButton>
	</div>
	<div v-if="diceResult" :class="$style.result">{{ diceResult }}</div>
	<div v-if="showMinTotal" :class="$style.option">{{ diceMinTotal }}</div>
	<div v-if="showMaxTotal" :class="$style.option">{{ diceMaxTotal }}</div>
	<div v-if="showAverageTotal" :class="$style.option">{{ diceAverageTotal }}</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import type { Ref } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	showMinTotal?: boolean;
	showMaxTotal?: boolean;
	showAverageTotal?: boolean;
}>(), {
	showMinTotal: false,
	showMaxTotal: false,
	showAverageTotal: false,
});

const diceCount = ref(1);
const diceFaces = ref(6);
const diceResult: Ref<number | null> = ref(null);
const diceMinTotal: Ref<number | null> = ref(null);
const diceMaxTotal: Ref<number | null> = ref(null);
const diceAverageTotal: Ref<number | null> = ref(null);

const rollDice = () => {
	let roll = new DiceRoll(`${diceCount.value}d${diceFaces.value}`);
	if (diceCount.value > 999) {
		return;
	}

	diceResult.value = roll.total;
	diceMinTotal.value = roll.minTotal;
	diceMaxTotal.value = roll.maxTotal;
	diceAverageTotal.value = roll.averageTotal;
};

</script>

<style lang="scss" module>
.root {
	padding: 8px 16px;

	> div {
		margin: 8px 0;
	}
}

.input {
	flex: 1 1 auto;
	padding: 8px;
}

.result {
	text-align: center;
	margin: auto;
}

.option {
	padding: 8px 0;
	text-align: left;
}
</style>
