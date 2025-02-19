<!--
SPDX-FileCopyrightText: noridev and cherrypick-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div v-if="weatherData">
		<div v-if="location" style="display: flex; align-items: center;">
			<i style="margin-right: 4px;" class="ti ti-map-pin"></i>
			{{ location }}
			<i v-if="props.useCurrentLocation" style="font-size: 0.7em; margin-left: 2px;" :class="locationLoading ? 'ti ti-location-search' : (supportsGeolocation ? 'ti ti-location-filled' : 'ti ti-location-off')"></i>
		</div>
		<div style="display: flex; justify-content: center; align-items: center;">
			<div :class="$style.current">
				<i :class="getWeatherIcon(Number(weatherData.hourly.weatherCode[0]))"></i>
				<div>{{ Math.round(Number(weatherData.hourly.temperature2m[0])) }}</div>
				<span :class="$style.tempUnit">{{ temperatureUnit }}</span>
			</div>
			<div :class="$style.details">
				<div>・{{ i18n.ts._weather.humidity }}: <span style="opacity: 0.7;">{{ Math.round(Number(weatherData.hourly.humidity[0])) }}</span><span :class="$style.detailsUnit">%</span></div>
				<div>・{{ i18n.ts._weather.pressure }}: <span style="opacity: 0.7;">{{ Math.round(Number(weatherData.hourly.surfacePressure[0])) }}</span><span :class="$style.detailsUnit">hPa</span></div>
				<div>・{{ i18n.ts._weather.precipitation }}: <span style="opacity: 0.7;">{{ Math.round(Number(weatherData.hourly.precipitation[0])) }}</span><span :class="$style.detailsUnit">mm/h</span></div>
			</div>
		</div>
		<div style="border-top: solid 1px var(--MI_THEME-divider); padding-top: 12px;">
			<div :class="$style.daily">
				<div v-for="(day, i) in weatherData.daily.time.slice(0, 3)" :key="i" :class="$style.day">
					<div style="font-size: 0.8em;">{{ formatDate(day) }}</div>
					<i style="margin: 4px 0;" :class="getWeatherIcon(Number(weatherData.daily.weatherCode[i]))"></i>
					<div><span style="opacity: 0.7;">{{ Math.round(Number(weatherData.daily.temperature2mMax[i])) }}</span> / <span style="opacity: 0.7;">{{ Math.round(Number(weatherData.daily.temperature2mMin[i])) }}</span><span :class="$style.detailsUnit">{{ temperatureUnit }}</span></div>
					<div><span style="opacity: 0.7;">{{ Math.round(Number(weatherData.daily.precipitationSum[i])) }}</span><span :class="$style.detailsUnit">mm</span></div>
					<div><span style="opacity: 0.7;">{{ Math.round(Number(weatherData.daily.precipitationProbabilityMean[i])) }}</span><span :class="$style.detailsUnit">%</span></div>
				</div>
			</div>
		</div>
		<div v-if="props.showSurfacePressure" :class="$style.pressureChart">
			<canvas ref="pressureChartEl"></canvas>
		</div>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { fetchWeatherApi } from 'openmeteo';
import { Chart, registerables } from 'chart.js';
import { chartVLine } from '@/scripts/chart-vline.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { defaultStore } from '@/store.js';

const props = withDefaults(defineProps<{
	latitude?: number;
	longtitude?: number;
	setTempUnitFahrenheit?: boolean;
	showSurfacePressure?: boolean;
	show12Hours?: boolean;
	useCurrentLocation?: boolean;
}>(), {
	latitude: 37.566,
	longtitude: 126.9784,
	setTempUnitFahrenheit: false,
	showSurfacePressure: false,
	show12Hours: false,
	useCurrentLocation: true,
});

Chart.register(...registerables);

// 開発用メモ
// シアトル: 47.3635, -122.1959

const weatherData = ref<WeatherData | null>(null);
const location = ref<string>('');
const pressureChartEl = ref<HTMLCanvasElement | null>(null);
let pressureChart: Chart | null = null;

const supportsGeolocation = ref<boolean>(false);
const locationLoading = ref(true);

const temperatureUnit = ref('°C');

interface WeatherData {
	hourly: {
		time: Date[];
		temperature2m: Float32Array;
		surfacePressure: Float32Array;
		weatherCode: Float32Array;
		precipitation: Float32Array;
		humidity: Float32Array;
	};
	daily: {
		time: Date[];
		weatherCode: Float32Array;
		temperature2mMax: Float32Array;
		temperature2mMin: Float32Array;
		precipitationSum: Float32Array;
		precipitationProbabilityMean: Float32Array;
	};
}

async function fetchWeather() {
	if (props.setTempUnitFahrenheit) temperatureUnit.value = '°F';
	else temperatureUnit.value = '°C';

	const url = 'https://api.open-meteo.com/v1/forecast';
	const params = {
		'latitude': props.latitude,
		'longitude': props.longtitude,
		'hourly': ['temperature_2m', 'surface_pressure', 'weather_code', 'precipitation', 'relative_humidity_2m'],
		'daily': ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'precipitation_probability_mean'],
		'timezone': 'auto',
		'temperature_unit': props.setTempUnitFahrenheit ? 'fahrenheit' : 'celsius',
	};

	const res = await fetchWeatherApi(url, params);
	const data = res[0];
	const hourly = data.hourly()!;
	const daily = data.daily()!;
	const utcOffsetSeconds = data.utcOffsetSeconds();

	const range = (start: number, stop: number, step: number) => Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

	const newWeatherData: WeatherData = {
		hourly: {
			time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
			temperature2m: hourly.variables(0)!.valuesArray()!,
			surfacePressure: hourly.variables(1)!.valuesArray()!,
			weatherCode: hourly.variables(2)!.valuesArray()!,
			precipitation: hourly.variables(3)!.valuesArray()!,
			humidity: hourly.variables(4)!.valuesArray()!,
		},
		daily: {
			time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
			weatherCode: daily.variables(0)!.valuesArray()!,
			temperature2mMax: daily.variables(1)!.valuesArray()!,
			temperature2mMin: daily.variables(2)!.valuesArray()!,
			precipitationSum: daily.variables(3)!.valuesArray()!,
			precipitationProbabilityMean: daily.variables(4)!.valuesArray()!,
		},
	};
	weatherData.value = newWeatherData;
}

function getWeatherIcon(code: number): string {
	const icons = {
		0: 'ti ti-sun-high',
		1: 'ti ti-sun',
		2: 'ti ti-sun-low',
		3: 'ti ti-cloud',
		45: 'ti ti-cloud-fog',
		48: 'ti ti-cloud-fog',
		51: 'ti ti-droplets',
		53: 'ti ti-droplets',
		55: 'ti ti-droplets',
		56: 'ti ti-droplets',
		57: 'ti ti-droplets',
		61: 'ti ti-umbrella',
		71: 'ti ti-snowflake',
		95: 'ti ti-bolt',
	};
	return icons[code] || 'ti ti-question-mark';
}

function formatDate(time: Date): string {
	const locale = miLocalStorage.getItem('lang') ?? 'ja-JP';
	return time.toLocaleDateString(locale, {
		month: 'numeric',
		day: 'numeric',
		weekday: 'short',
	});
}

async function fetchLocation() {
	try {
		const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${props.latitude}&lon=${props.longtitude}&format=json`);
		const data = await response.json();
		location.value = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state;
	} catch (err) {
		console.error(err);
	}
}

function createPressureChart() {
	if (!pressureChartEl.value || !weatherData.value || !props.showSurfacePressure) return;

	const locale = miLocalStorage.getItem('lang') ?? 'ja-JP';
	const now = new Date();

	const currentHour = weatherData.value.hourly.time.findIndex(time => {
		const timeDate = new Date(time);
		return timeDate.getTime() >= now.getTime();
	});

	const startIndex = currentHour === -1 ? 0 : currentHour;
	const endIndex = Math.min(startIndex + 24, weatherData.value.hourly.time.length);

	const hours = weatherData.value.hourly.time
		.slice(startIndex, endIndex)
		.map(time => new Date(time).toLocaleTimeString(locale, {
			hour: 'numeric',
			minute: '2-digit',
			hour12: props.show12Hours,
		}));

	const pressures = Array.from(
		weatherData.value.hourly.surfacePressure.slice(startIndex, endIndex),
	);

	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	if (pressureChart) pressureChart.destroy();

	Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--MI_THEME-fg');
	Chart.defaults.borderColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	pressureChart = new Chart(pressureChartEl.value, {
		type: 'line',
		data: {
			labels: hours,
			datasets: [{
				label: '気圧 (hPa)',
				data: pressures,
				tension: 0.3,
				pointRadius: 2,
				borderColor: '#00E396',
			}],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false,
				},
			},
			scales: {
				y: {
					beginAtZero: false,
					ticks: {
						stepSize: 1,
						display: true,
					},
					grid: {
					},
				},
				x: {
					ticks: {
						maxRotation: 45,
						minRotation: 45,
						autoSkip: true,
						maxTicksLimit: 12,
					},
					grid: {
					},
				},
			},
		},
		plugins: [chartVLine(vLineColor)],
	});
}

const getLocation = () => {
	if (!props.useCurrentLocation && !navigator.geolocation) {
		locationLoading.value = false;
		return;
	}

	navigator.geolocation.getCurrentPosition(() => {
		supportsGeolocation.value = true;
		locationLoading.value = false;
	}, () => {
		supportsGeolocation.value = false;
		locationLoading.value = false;
	});
};

onMounted(async () => {
	getLocation();

	await Promise.all([fetchWeather(), fetchLocation()]);
	createPressureChart();

	const interval = setInterval(async () => {
		await fetchWeather();
		createPressureChart();
	}, 1000 * 60 * 60);

	onUnmounted(() => {
		clearInterval(interval);
	});
});

watch([() => props.latitude, () => props.longtitude], async () => {
	await Promise.all([
		fetchWeather(),
		fetchLocation(),
	]);
	createPressureChart();
});

watch([() => weatherData.value, () => props.showSurfacePressure],
	() => {
		nextTick(() => {
			createPressureChart();
		});
	},
);
</script>

<style lang="scss" module>
.root {
	padding: 8px 16px;

	> div {
		margin: 8px 0;
	}
}

.current {
	display: flex;
	align-items: center;
	justify-content: center;
	// gap: 16px;
	margin: 16px 0;
	padding: 16px;
	font-size: 2.2em;

	& > i {
		color: var(--MI_THEME-accent);
		opacity: 0.9;
		margin-right: 6px;
	}

	& > div {
		font-weight: bold;
		color: var(--MI_THEME-fg);
	}
}

.tempUnit {
	font-size: 0.7em;
	opacity: 0.8;
	margin-left: 2px;
}

.details {
	text-align: left;
	margin: 16px 0;
	padding: 16px;
	border-left: solid 1px var(--MI_THEME-divider);
}

.detailsUnit {
	font-size: 0.8em;
	margin-left: 2px;
	opacity: 0.5;
}

.daily {
	display: flex;
	justify-content: space-between;
	text-align: center;
	margin: 0 24px;
}

.day {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.pressureChart {
	height: 200px;
	margin: 16px 0;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	border: solid 1px var(--MI_THEME-divider);

	canvas {
		width: 100% !important;
		height: 100% !important;
	}
}
</style>
