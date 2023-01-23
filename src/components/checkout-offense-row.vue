<script>
export default {
  methods: {
    isStipulated: function (filingType) {
      return (
        filingType == "StipExC" ||
        filingType == "StipExNC" ||
        filingType == "StipExNCrim" ||
        filingType == "StipSC" ||
        filingType == "StipSDui"
      );
    },
    dateFormatSimple: function (value) {
      if (!value) return "";
      return moment(value).format("MM/DD/YYYY");
    },
    toCountyCode: function (value) {
      if (!value) return "";
      return countyCodeFromCounty(value);
    },
  },
  props: ["filing"],
};
</script>

<template>
<tr class="count-row">
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
  </tr>
</template>
