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
      >, and hereby moves the Court to expunge the record of the following
      charge<span v-if="filing.multipleCounts">s</span>
      pursuant to 13 V.S.A. &sect; 7603.
    </p>
    <p>
      1. Petitioner was charged but never convicted of the following crime<span
        v-if="filing.multipleCounts"
        >s</span
      >:
    </p>
    <count-table
      :filing="filing"
      date-label="Date of Dismissal"
      desc-label="Charge"
      :pluralize-desc="true"
    ></count-table>

    <p>
      2.
      <span v-if="filing.multipleCounts">All dismissed charges</span
      ><span v-else>This charge is</span> eligible for expungement pursuant to 13
      V.S.A. &sect; 7603.
    </p>

    <p>
      3. Expunging all record of
      <span v-if="filing.multipleCounts">these dismissed charges</span
      ><span v-else>this dismissed charge</span> serves the interests of justice,
      as
    </p>
  </div>
</template>
