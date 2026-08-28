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
      <span v-if="filing.multipleCounts">s</span> pursuant to 13 V.S.A. &sect;
      7602.
    </p>
    <p>
      1. Petitioner was convicted of the following crime<span
        v-if="filing.multipleCounts"
        >s</span
      >:
    </p>
    <count-table :filing="filing"></count-table>
    <p>
      2. The qualifying crime<span v-if="filing.multipleCounts">s were</span
      ><span v-else> was</span> committed after the Petition reached the age of
      19.
    </p>

    <p>3. All restitution ordered here has been paid in full.</p>
    <p>4. Sealing this record serves the interests of justice, as</p>
  </div>
</template>
