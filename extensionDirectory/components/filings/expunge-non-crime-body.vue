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
      <span v-if="filing.multipleCounts">charges</span
      ><span v-else>charge</span> pursuant to 13 V.S.A. &sect; 7602(a)(1)(B).
    </p>
    <p>
      1. Petitioner was convicted of the following
      <span v-if="filing.multipleCounts">crimes</span
      ><span v-else>crime</span>:
    </p>
    <count-table
      :filing="filing"
      desc-label="Charge"
      :pluralize-desc="true"
    ></count-table>

    <p>
      2. The underlying conduct of
      <span v-if="filing.multipleCounts">these offenses</span
      ><span v-else>this offense</span> is no longer prohibited by law or
      designated as a criminal offense.
    </p>
    <p>
      3. Expunging all record of this conviction serves the interests of
      justice.
    </p>
  </div>
</template>
