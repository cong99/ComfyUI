<template>
	<div class="pa-4 text-center">
		<v-dialog v-model="dialog" max-width="400" size="small">
			<v-card title="Text Match" density="compact">
				<v-card-text>
					<v-combobox label="Name" v-model="name" :items="nameOptions" density="compact" :rules="[(v) => !!v || 'name is required']"></v-combobox>
					<v-select
						label="Match Type"
						density="compact"
						v-model="matchType"
						:items="matchTypes"
						:rules="[(v) => !!v || 'matchType is required']"
						required
					></v-select>
				</v-card-text>

				<v-divider></v-divider>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="primary" text="Save" variant="tonal" @click="onClick" size="small"></v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
const dialog = ref(false)
const name = ref('')
const nameOptions = ref([])
const matchType = ref('')
const matchTypes = ref(['Start', 'End', 'Content'])
let ctx

const props = defineProps({
	onCompMounted: Function,
	onSave: Function,
})

onMounted(() => {
	props.onCompMounted?.({
		open(context, options) {
      ctx = context
      nameOptions.value = options || []
			dialog.value = true
		},
	})
})

function onClick() {
  if (!name.value || !matchType.value) {
    return
  }
	dialog.value = false
	props.onSave?.({
    name: name.value,
    matchType: matchType.value,
    context: ctx
  })
  ctx = undefined
}
</script>
