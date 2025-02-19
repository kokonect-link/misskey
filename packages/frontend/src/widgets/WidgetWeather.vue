<!--
SPDX-FileCopyrightText: noridev and cherrypick-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false">
	<div class="_monospace">
		<MkWeather
			:key="`${widgetProps.latitude},${widgetProps.longtitude}`"
			:latitude="widgetProps.latitude"
			:longtitude="widgetProps.longtitude"
			:setTempUnitFahrenheit="widgetProps.setTempUnitFahrenheit"
			:showSurfacePressure="widgetProps.showSurfacePressure"
			:show12Hours="widgetProps.show12Hours"
			:useCurrentLocation="widgetProps.useCurrentLocation"
		/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkWeather from '@/components/MkWeather.vue';

const name = 'weather';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	latitude: {
		type: 'number' as const,
		default: 37.566,
	},
	longtitude: {
		type: 'number' as const,
		default: 126.9784,
	},
	setTempUnitFahrenheit: {
		type: 'boolean' as const,
		default: false,
	},
	showSurfacePressure: {
		type: 'boolean' as const,
		default: false,
	},
	show12Hours: {
		type: 'boolean' as const,
		default: false,
	},
	useCurrentLocation: {
		type: 'boolean' as const,
		default: true,
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

const getLocation = () => {
	if (widgetProps.useCurrentLocation && navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				widgetProps.latitude = position.coords.latitude;
				widgetProps.longtitude = position.coords.longitude;
			},
			(error) => {
				console.warn('Geolocation error:', error);
			},
		);
	}
};

onMounted(() => {
	getLocation();
});

watch(() => [widgetProps.latitude, widgetProps.longtitude], { immediate: true });
watch(() => widgetProps.setTempUnitFahrenheit, { immediate: true });
watch(() => widgetProps.showSurfacePressure, { immediate: true });
watch(() => widgetProps.show12Hours, { immediate: true });
watch(() => widgetProps.useCurrentLocation, { immediate: true });

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.weather {
	padding: 12px;
}

.current {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	margin-bottom: 12px;

	& > i {
		font-size: 2.5em;
	}

	.temp {
		font-size: 2em;
		font-weight: bold;
	}
}

.daily {
	display: flex;
	justify-content: space-between;
	text-align: center;
	border-top: solid 1px var(--MI_THEME-divider);
	padding-top: 12px;
}

.day {
	display: flex;
	flex-direction: column;
	align-items: center;
}

</style>
