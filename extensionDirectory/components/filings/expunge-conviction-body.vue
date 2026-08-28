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
      >, and hereby moves the Court to expunge the record of the above-captioned
      conviction<span v-if="filing.multipleCounts">s</span>
      pursuant to 13 V.S.A. &sect; 7602.
    </p>

    <p>
      1. Petitioner was convicted of the following crime<span
        v-if="filing.multipleCounts"
        >s</span
      >:
    </p>
    <count-table :filing="filing"></count-table>

    <p>
      2. <span v-if="filing.multipleCounts">These are</span
      ><span v-else>This is a</span> qualifying crime<span
        v-if="filing.multipleCounts"
        >s</span
      >
      pursuant to 13 V.S.A. &sect; 7601(4).
    </p>
    <p>
      <span v-if="!filing.isStipulated"
        >3. Petitioner completed the terms and conditions of their sentence over
        5 years ago, and paid all restitution owed.</span
      >
    </p>
    <p>
      <span v-if="!filing.isStipulated">4.</span><span v-else>3. </span>
      Expunging all record of
      <span v-if="filing.multipleCounts">these convictions</span
      ><span v-else>this conviction</span> is in the interests of justice
      because:
    </p>
  </div>
</template>
