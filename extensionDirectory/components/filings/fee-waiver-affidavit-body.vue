<script>
import { storeToRefs } from 'pinia';
import { useDataStore } from '../../store.mjs';

export default {
  props: {
    filing: { type: Object, required: true },
    petitioner: { type: Object, required: true },
  },
  setup() {
    const { responses } = storeToRefs(useDataStore());
    return { responses };
  },
  methods: {
    returnFine: function (fileId) {
      fileId = fileId.replace('Affidavit', '');
      let docket = 'NoA-' + fileId.substring(fileId.indexOf('-') + 1);
      return parseFloat(this.responses[docket + '-fine']).toFixed(2);
    },
    returnSurcharge: function (fileId) {
      fileId = fileId.replace('Affidavit', '');
      let docket = 'NoA-' + fileId.substring(fileId.indexOf('-') + 1);
      return parseFloat(this.responses[docket + '-surcharge']).toFixed(2);
    },
  },
};
</script>

<template>
  <div class="filing-body" v-bind:id="filing.id">
    <p class="indent">
      {{ petitioner.name }}, being duly sworn, deposes and says under oath:
      <ol>
        <li>
          I am petitioning the Court to clear my Vermont criminal record in the
          above referenced matter.
        </li>
        <li v-if="returnFine(filing.id) > 0">
          I have outstanding fines totaling ${{ returnFine(filing.id) }}.
        </li>
        <li v-if="returnSurcharge(filing.id) > 0">
          I have outstanding surcharges totaling ${{ returnSurcharge(filing.id)
          }}.
        </li>
        <li>
          I do not have the means to pay this legal financial debt without
          substantial hardship.
        </li>
        <li>
          This debt is the sole remaining barrier to the relief sought in this
          matter.
        </li>
        <li>
          I respectfully ask the court to waive this financial obligation so
          that I may clear my record.
        </li>
      </ol>
    </p>
  </div>
</template>
