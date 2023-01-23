<script>
import moment from 'moment';

export default {
  props: ["count", "dob"],
  methods: {
    decimalAgeInYears: function (value) {
      if (!value) return "";
      if (!this.dob) return "";
      let fromTime = moment(value).diff(moment(this.dob));
      let duration = moment.duration(fromTime);
      return (duration.asDays() / 365.25).toFixed(2);
    },
    dispositionTrimmer: function (dispo) {
      let trimmedDisp = "";
      if (dispo.length > 15) {
        trimmedDisp = dispo.substring(0, 15) + "...";
      } else {
        trimmedDisp = dispo;
      }
      return trimmedDisp;
    },
  },
};
</script>

<template>
<div class="card-header__pills-row">
            <span v-if="count.offenseClass =='mis'" class="pill pill--rounded pill--outline-green">
                    Mis
            </span>
            <span v-if="count.offenseClass == 'fel'" class="pill pill--rounded pill--outline-black">
                    Fel
            </span>
            <template v-if="count.offenseDisposition">
            <span v-if="count.isDismissed === true" class="pill pill--rounded pill--outline-green">
              {{dispositionTrimmer(count.offenseDisposition)}}
            </span>
            <span v-if="count.isDismissed === false" class="pill pill--rounded pill--outline-black">
                {{dispositionTrimmer(count.offenseDisposition)}}
            </span>
            </template>
            <template v-if="count.dispositionDate">
            <span v-if="decimalAgeInYears(count.dispositionDate) < 18" class='pill pill--rounded pill--outline-green'> Under 18 at time of disposition</span>
            <span v-if="decimalAgeInYears(count.dispositionDate) >= 18 && decimalAgeInYears(count.dispositionDate) < 21" class='pill pill--rounded pill--outline-green'> Under 21 </span>
            <span v-if="decimalAgeInYears(count.dispositionDate) >= 21 && decimalAgeInYears(count.dispositionDate) < 25" class='pill pill--rounded pill--outline-green'> Under 25 </span>
            <span v-if="decimalAgeInYears(count.dispositionDate) >= 21" class='pill pill--rounded pill--outline-black'> Adult </span>
            </template>
            <span v-if="count.outstandingPayment == true" class='pill pill--rounded pill--outline-black'>Surcharge</span>

        </div>
</template>
