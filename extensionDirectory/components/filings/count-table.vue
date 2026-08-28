<script>
import { dateFormatSimple, maxDate, toCountyCode } from '../../utils';

/*
 * The conviction/charge table shared by every petition body. The only things
 * that vary between petition types are the two column headers, so those are
 * exposed as props:
 *  - dateLabel:      "Conviction Date" (default) or "Date of Dismissal"
 *  - descLabel:      "Offense Description" (default) or "Charge"
 *  - pluralizeDesc:  when true, append an "s" to descLabel for multi-count filings
 */
export default {
  props: {
    filing: { type: Object, required: true },
    dateLabel: { type: String, default: 'Conviction Date' },
    descLabel: { type: String, default: 'Offense Description' },
    pluralizeDesc: { type: Boolean, default: false },
  },
  computed: {
    maxDate,
  },
  methods: {
    dateFormatSimple,
    toCountyCode,
  },
};
</script>

<template>
  <table class="count-table">
    <thead class="count-table__header">
      <th valign="middle" scope="col">{{ dateLabel }}</th>
      <th valign="middle" colspan="2" scope="col">
        {{ descLabel
        }}<span v-if="pluralizeDesc && filing.multipleCounts">s</span>
      </th>
    </thead>
    <tbody class="count-table__body">
      <tr class="count-item" v-for="count in filing.counts">
        <td class="count-item__date">
          <span class="no-visible">{{
            dateFormatSimple(count.dispositionDate)
          }}</span>
          <input
            type="date"
            class="no-print"
            v-model="count.dispositionDate"
            :max="maxDate"
          />
        </td>
        <td class="count-item__description">
          <span class="no-visible"
            >{{ count.description }} ({{ count.docketNum }}
            {{ toCountyCode(count.county) }})</span
          >
          <textarea
            rows="1"
            class="no-print count-item__textarea"
            v-model="count.description"
          ></textarea>
        </td>
        <td class="no-print">
          {{ count.docketNum }} {{ toCountyCode(count.county) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
