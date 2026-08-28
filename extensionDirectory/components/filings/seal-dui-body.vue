<script>
import { storeToRefs } from 'pinia';
import { useDataStore } from '../../store.mjs';
import { proSeFromRole } from '../../utils';
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
    proSeFromRole,
  },
};
</script>

<template>
  <div class="filing-body">
    <p class="indent">
      NOW COMES {{ petitioner.name }} (DOB: {{ petitioner.dob }}),
      <span v-if="proSeFromRole(settings.role)"
        >appearing <span class="italic">pro se</span>
      </span>
      <span v-else>
        by and through counsel,
        <span>{{ settings['attorney'] }}</span> </span
      >, and hereby moves the Court to seal the record of the above-captioned
      conviction
      <span v-if="filing.multipleCounts">s</span> pursuant to 13 V.S.A. &sect;
      7602(a)(1)(C).
    </p>
    <p>
      1. Petitioner was convicted of the following crime<span
        v-if="filing.multipleCounts"
        >s</span
      >:
    </p>
    <count-table :filing="filing"></count-table>
    <p>
      2. At least 10 years have elapsed since the date petitioner successfully
      completed their sentence.
    </p>

    <p>
      3. This conviction is the only violation of 23 V.S.A. &sect; 1201 that
      petitioner has on their record, and petitioner has not been convicted of
      any new crime since they were convicted of this offense.
    </p>
    <p>4. All restitution ordered here has been paid in full.</p>
    <p>5. Sealing this record serves the interests of justice, as</p>
  </div>
</template>
