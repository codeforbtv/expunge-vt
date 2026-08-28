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
    <p class="indent" v-if="proSeFromRole(settings.role)">
      NOW COMES {{ petitioner.name }} (DOB: {{ dateFormatSimple(petitioner.dob)
      }}), appearing <span class="italic">pro se</span>, and hereby enters this
      notice of appearance in the above captioned action.
      <span class="email-test" v-if="settings.emailConsent"
        ><br /><br />By signing this notice of appearance below, I hereby agree
        to the acceptance of all electronic filings at the following email
        address: <b>{{ petitioner.email }}</b
        >.</span
      >
    </p>
    <p class="indent" v-else>
      NOW COMES <span>{{ settings['attorney'] }}</span
      >, by and on behalf of {{ petitioner.name }} (DOB:
      {{ dateFormatSimple(petitioner.dob) }}), and hereby enters this notice of
      appearance in the above captioned action.
    </p>
  </div>
</template>
