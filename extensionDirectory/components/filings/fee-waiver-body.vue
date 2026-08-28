<script>
import { storeToRefs } from 'pinia';
import { useDataStore } from '../../store.mjs';
import { dateFormatSimple, proSeFromRole } from '../../utils';

export default {
  props: {
    filing: { type: Object, required: true },
    petitioner: { type: Object, required: true },
  },
  setup() {
    const { settings, responses } = storeToRefs(useDataStore());
    return { settings, responses };
  },
  methods: {
    dateFormatSimple,
    proSeFromRole,
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
  <div v-bind:id="filing.id" class="filing-body">
    <p class="indent">
      NOW COMES {{ petitioner.name }} (DOB:
      {{ dateFormatSimple(petitioner.dob) }}),
      <span v-if="proSeFromRole(settings.role)"
        >appearing <span class="italic">pro se</span>
      </span>
      <span v-else>
        by and through counsel,
        <span>{{ settings['attorney'] }}</span> </span
      >, and hereby moves the Court to
      <span v-if="returnSurcharge(filing.id) > 0">waive surcharges </span
      ><span v-if="returnFine(filing.id) > 0 && returnSurcharge(filing.id) > 0"
        >and
      </span>
      <span v-if="returnFine(filing.id) > 0">suspend the fines </span>associated
      with the above-captioned case for the reasons set forth herein.
      <ol>
        <li v-if="returnSurcharge(filing.id) > 0">
          Pursuant to 13 V.S.A. &#167; 7282(b), surcharges can be waived in an
          expungement or sealing proceeding "where the petitioner demonstrates
          an inability to pay."
        </li>
        <li v-if="returnFine(filing.id) > 0">
          Pursuant to 13 V.S.A &#167; 7178 "[a] Superior judge, in his or her
          discretion, may suspend all or any part of the fine assessed against a
          respondent."
        </li>
        <li v-if="returnFine(filing.id) > 0">
          At the time of conviction, the court fined Petitioner
          ${{ returnFine(filing.id) }}.
        </li>
        <li v-if="returnSurcharge(filing.id) > 0">
          At the time of conviction, the court assessed Petitioner a surcharge of
          ${{ returnSurcharge(filing.id) }}.
        </li>
        <li>
          Petitioner has contemporaneously filed petition for record clearance.
        </li>
        <li>
          But for these legal financial obligations, petitioner is eligible for
          relief.
        </li>
        <li>Petitioner is unable to pay these legal financial obligations.</li>
        <li>
          Waiver of legal financial obligations would further the interests of
          justice for the reasons set forth in the attached sworn statement and
          because the relief petitioner seeks should not be barred due to
          economic status.
        </li>
      </ol>
    </p>
  </div>
</template>
