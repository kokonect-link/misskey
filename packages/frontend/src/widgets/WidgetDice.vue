<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false">
	<div class="_monospace" :class="[$style.root, {_panel: !widgetProps.transparent}]">
		<MkDice
			:showMinTotal="widgetProps.showMinTotal"
			:showMaxTotal="widgetProps.showMaxTotal"
			:showAverageTotal="widgetProps.showAverageTotal"
		/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkDice from '@/components/MkDice.vue';
import MkContainer from '@/components/MkContainer.vue';

const name = 'dice';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	showMinTotal: {
		type: 'boolean' as const,
		default: false,
	},
	showMaxTotal: {
		type: 'boolean' as const,
		default: false,
	},
	showAverageTotal: {
		type: 'boolean' as const,
		default: false,
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

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	padding: 16px 0;
}
</style>
