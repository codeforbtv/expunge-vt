//Vue Components

Vue.component('docket-caption', {
  template: `<div class="docket-caption"> 
      <div class="docket-caption__names">
        <p class="">STATE OF VERMONT,</p>
        <p><i>Respondent</i></p>
        <p>v.</p>
        <p class="docket-caption__party">{{name}},</p>
        <p class="docket-caption__label">Petitioner</p>
        </div>
      </div>
      `,
  props: ['name'],
});

Vue.component('filing-nav', {
  template: `<div class="filing-nav no-print" id="filing-nav"> 
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
            <a v-bind:href="'#'+filing.id" v-bind:class="'petition-type__'+filing.type">{{filing.title | navTitleFilter}}</a>
            <p class="filing-nav__counts">{{filing | petitionCountFilter}}</p>
          </li>
        </ol>
        </li>
      </ol>
      </div>
      `,
  filters: {
    navTitleFilter(txt) {
      const trimStip = txt.startsWith('Stipulated ')
        ? txt.substring(11) + ' (Stip)'
        : txt;
      const trimPetion = trimStip.startsWith('Petition to ')
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
      if (filing.type == 'NoA') {
        // default (ungrouped): "####-##-## (N Counts)"
        if (!this.app.groupCounts && !this.app.groupNoas) {
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
        if (!this.app.groupCounts && !this.app.groupNoas) {
          return filing.counts.length > 1
            ? `${filing.counts.length} Counts`
            : '';
        }
        // groupCounts: "####-##-##"
        else if (this.app.groupNoas && !this.app.groupCounts) {
          return `${filing.docketNums[0].num}`;
        }
        // groupCounts: "N Dockets (N Counts)"
        else if (this.app.groupNoas && this.app.groupCounts) {
          return `${filing.docketNums.length} Dockets (${filing.numCountsString})`;
        }
      }
    },
  },
  props: ['filings'],
});

Vue.component('filing-footer', {
  template: `<div class="stipulated-closing" v-if="stipulated">
                  <p class="stipulated-closing__dates"><span class="bold">Stipulated and agreed</span> this <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, 20<span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
                  <div class="filing-closing__signature-box">
                      <p class="filing-closing__name">State's Attorney/Attorney General</p>
                  </div>
              </div>
          </div>
          `,
  props: ['stipulated'],
});

Vue.component('filing-dated-city', {
  template: `
  <p class="filing-dated-city indent">
  Dated in the city of <span class="fill-in quarter-width"></span>, 
  on the day of <span class="fill-in digit-width"></span>, 
  in the month of <span class="fill-in word-width"></span>,<br/>
  in the year 20<span class="fill-in digit-width"></span>.
</p>
  `,
});

Vue.component('pills-row', {
  template: `<div class="card-header__pills-row">
                <span v-if="count.offenseClass =='mis'" class="pill pill--rounded pill--outline-green">
                        Mis
                </span>
                <span v-if="count.offenseClass == 'fel'" class="pill pill--rounded pill--outline-black">
                        Fel
                </span>
                <template v-if="count.offenseDisposition">
                <span v-if="count.isDismissed === true" class="pill pill--rounded pill--outline-green">
                    {{count.offenseDisposition}}
                </span>
                <span v-if="count.isDismissed === false" class="pill pill--rounded pill--outline-black">
                    {{count.offenseDisposition}}
                </span>
                </template>
                <template v-if="count.dispositionDate">
                <span v-if="decimalAgeInYears(count.dispositionDate) < 18" class='pill pill--rounded pill--outline-green'> Under 18 </span>
                <span v-if="decimalAgeInYears(count.dispositionDate) >= 18 && decimalAgeInYears(count.dispositionDate) < 21" class='pill pill--rounded pill--outline-green'> Under 21 </span>
                <span v-if="decimalAgeInYears(count.dispositionDate) >= 21" class='pill pill--rounded pill--outline-black'> Adult </span>
                </template>
                <span v-if="count.outstandingPayment == true" class='pill pill--rounded pill--outline-black'>Surcharge</span>

            </div>
          `,
  props: ['count', 'dob'],
  methods: {
    decimalAgeInYears: function (value) {
      if (!value) return '';
      if (!this.dob) return '';
      let fromTime = moment(value).diff(moment(this.dob));
      let duration = moment.duration(fromTime);
      return duration.asDays() / 365.25;
    },
  },
});

/* TODO: implement or remove
 * A seemingly useful component that returns a plain-english explaination of a given filing type.
 */
Vue.component('filing-type-heading', {
  methods: {
    getCheckoutPhrases(fType) {
      checkoutPhrases = [
        {
          type: 'ExC',
          stipType: 'StipExC',
          phrase:
            'The following are prior conviction(s) for which we prepared a petition to expunge:',
        },
        {
          type: 'ExNC',
          stipType: 'StipExNC',
          phrase:
            'The following are cases that DID NOT result in a conviction and we prepared a petition to expunge:',
        },
        {
          type: 'ExNCrim',
          stipType: 'StipExNCrim',
          phrase:
            'The following are counts that are no longer crimes and we prepared a petition to expunge:',
        },
        {
          type: 'SC',
          stipType: 'StipSC',
          phrase:
            'The following are prior convictions and we prepared a petition to seal:',
        },
        {
          type: 'SDui',
          stipType: 'StipSDui',
          phrase:
            'The following is a prior DUI conviction and we filed a petition to seal:',
        },
      ];

      for (i = 0; i < checkoutPhrases.length; i++) {
        if (
          checkoutPhrases[i]['type'] == fType ||
          checkoutPhrases[i]['stipType'] == fType
        ) {
          return checkoutPhrases[i]['phrase'];
        }
      }
    },
  },
  template: `
  <div>
      <p>
        {{getCheckoutPhrases(heading)}}
      </p>
  </div>
  `,
  props: ['heading'],
});

Vue.component('checkout-offense-row', {
  methods: {
    isStipulated: function (filingType) {
      return (
        filingType == 'StipExC' ||
        filingType == 'StipExNC' ||
        filingType == 'StipExNCrim' ||
        filingType == 'StipSC' ||
        filingType == 'StipSDui'
      );
    },
    dateFormatSimple: function (value) {
      if (!value) return '';
      return moment(value).format('MM/DD/YYYY');
    },
    toCountyCode: function (value) {
      if (!value) return '';
      return countyCodeFromCounty(value);
    },
  },
  template: `
  <tr class='count-row'>
    <td>
      <span v-if='isStipulated(filing.filingType)'><i class='fas fa-handshake'></i>&nbsp;</span>

      {{filing.description}}
    
      <div class='date-list'>
          <div class= 'label pill pill--rounded pill--outline-black'>Offense: {{dateFormatSimple(filing.allegedOffenseDate)}}</div>
          
          <div class= 'label pill pill--rounded pill--outline-black'>Arrest: {{dateFormatSimple(filing.arrestCitationDate)}}</div>
          
          <div class= 'label pill pill--rounded pill--outline-black'>Disposed: {{dateFormatSimple(filing.dispositionDate)}}</div>
          
      </div>
    </td>
    <td>{{filing.offenseDisposition}}</td>
    <td>{{filing.docketNum}} {{toCountyCode(filing.county)}}</td>
  </tr>`,
  props: ['filing'],
});

function countyCodeFromCounty(county) {
  countyCodes = {
    Addison: 'Ancr',
    Bennington: 'Bncr',
    Caledonia: 'Cacr',
    Chittenden: 'Cncr',
    Essex: 'Excr',
    Franklin: 'Frcr',
    'Grand Isle': 'Gicr',
    Lamoille: 'Lecr',
    Orange: 'Oecr',
    Orleans: 'Oscr',
    Rutland: 'Rdcr',
    Washington: 'Wncr',
    Windham: 'Wmcr',
    Windsor: 'Wrcr',
  };
  return countyCodes[county];
}
