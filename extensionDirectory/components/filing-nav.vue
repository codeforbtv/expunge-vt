<script>
export default {
  methods: {
    navTitleFilter(txt) {
      const trimStip = txt.startsWith("Stipulated ")
        ? txt.substring(11) + " (Stip)"
        : txt;
      const trimPetion = trimStip.startsWith("Petition to ")
        ? trimStip.substring(12)
        : trimStip;
      return trimPetion;
    },
    /**
     * The subtitle for each petition in the nav varies depending on several factors.
     * @todo Finish selecting the best subtitles after all other PRs are merged in
     * @param {object} filing All the info for the current filing
     */
    petitionCountFilter(filing) {
      // NoA subtitle
      if (filing.type == "NoA") {
        // default (ungrouped): "####-##-## (N Counts)"
        if (!this.settings.groupCounts && !this.settings.groupNoas) {
          return `${filing.docketNums[0].num} (${filing.numCountsString})`;
        }
        // two cases, same text: "N Dockets (N Counts)"
        //    1. groupNoas only
        //    2. groupCounts & groupNoas
        else {
          return `${filing.docketNums.length} Dockets (${filing.numCountsString})`;
        }
      }
      // Petition subtitles
      else {
        // default (ungrouped): "N Counts" (or blank if counts == 1)
        if (!this.settings.groupCounts && !this.settings.groupNoas) {
          return filing.counts.length > 1 ? `${filing.counts.length} Counts` : "";
        }
        // groupCounts: "####-##-##"
        else if (this.settings.groupNoas && !this.settings.groupCounts) {
          return `${filing.docketNums[0].num}`;
        }
        // groupCounts: "N Dockets (N Counts)"
        else if (this.settings.groupNoas && this.settings.groupCounts) {
          return `${filing.docketNums.length} Dockets (${filing.numCountsString})`;
        }
      }
    },
  },
  props: ["filings", "settings"],
};
</script>

<template>
<div class="filing-nav no-print" id="filing-nav"> 
      <ol>
        <li class="cover-sheet filing-nav__parent-link">
          <a href="#extra-documents">Cover Sheet</a>
          <ol>
            <li class="filing-nav__child-link">
              <a href="#clinic-checkout">Cover Letter</a>
            </li>
            <li class="filing-nav__child-link">
              <a href="#client-checkout">Checkout Sheet</a>
            </li>
          </ol>
        </li>
        <br>
        <li v-for="group in filings" class="filing-nav__parent-link">
          <a href v-bind:href="'#'+group.county">{{group.county}}</a>
          <ol>
            <li v-for="filing in group.filings" class="filing-nav__child-link" v-bind:class="'petition-type__'+filing.type">
              <a v-bind:href="'#'+filing.id" v-bind:class="'petition-type__'+filing.type">{{navTitleFilter(filing.title)}}</a>
              <p class="filing-nav__counts">{{petitionCountFilter(filing)}}</p>
            </li>
          </ol>
        </li>
      </ol>
      </div>
</template>
