<script>
import { storeToRefs } from 'pinia';
import { useDataStore } from '../../store.mjs';
import { dateFormatSimple, proSeFromRole } from '../../utils';
import countTable from './count-table.vue';

export default {
  components: { countTable },
  props: {
    filing: { type: Object, required: true },
    petitioner: { type: Object, required: true },
  },
  setup() {
    const { settings } = storeToRefs(useDataStore());
    return { settings };
  },
  methods: {
    dateFormatSimple,
    proSeFromRole,
  },
};
</script>

<template>
  <div class="filing-body">
    <p class="indent">
      NOW COMES {{ petitioner.name }} (DOB: {{ dateFormatSimple(petitioner.dob)
      }}),
      <span v-if="proSeFromRole(settings.role)"
        >appearing <span class="italic">pro se</span>
      </span>
      <span v-else>
        by and through counsel,
        <span>{{ settings['attorney'] }}</span> </span
      >, and hereby moves the Court to seal the record of the above-captioned
      conviction
      <span v-if="filing.multipleCounts">s</span> pursuant to
      <span v-if="2 == 2">33 V.S.A. &sect; 5119(g)</span
      ><span v-else>13 V.S.A. 7602</span>.
    </p>
    <p>
      1. Petitioner was convicted of the following crime<span
        v-if="filing.multipleCounts"
        >s</span
      >:
    </p>
    <count-table :filing="filing"></count-table>
    <p>
      2. Petitioner was under 25 when the crime<span
        v-if="filing.multipleCounts"
        >s were</span
      ><span v-else> was</span> committed.
    </p>

    <p>
      3. Petitioner was not later convicted of a listed crime, pursuant to 13
      V.S.A. &sect; 5301(7), within the last 10 years, nor is petitioner
      currently being charged of such an offense.
    </p>
    <p>
      4. Petitioner believes the court will find that they have been
      rehabilitated, as evidenced by the following:
    </p>
  </div>
</template>
