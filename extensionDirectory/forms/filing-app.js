
document.addEventListener("DOMContentLoaded", function () {
    initButtons();
}, false);



function initButtons(){
    document.getElementById('js-print').addEventListener('click', printDocument);

}
function printDocument(){
    window.print();
}

Vue.component('docket-caption', {
  template: (`<div class="docket-caption"> 
      <div class="docket-caption__names">
      <p class="docket-caption__party">State of Vermont,</p>
      <p>v.</p>
      <p class="docket-caption__party">{{name}}</p>
      <p class="docket-caption__label">Petitioner</p>
      </div>
      <div class="capParens">
          )<br>)<br>)<br>)
        </div>
      </div>`),
  props: ['name']

})


Vue.component('filing-footer', {
  template: (`<div class="filing-closing">
            <p class="filing-closing__salutation">Respectfully requested,</p>
            <div class="filing-closing__signature-area">
                <div class="filing-closing__signature-box">
                    <p class="filing-closing__name">{{signature.name}}, Petitioner</p>
                    <p class="filing-closing__petitioner-address">{{signature.address1}}<br>{{signature.address2}}</p>
                </div>
                <div class="filing-closing__date-box">
                    <p>Date</p>
                </div>
            </div>

            <div class="stipulated-closing" v-if="stipulated">
                <p class="stipulated-closing__dates"><span class="bold">Stipulated and agreed</span> this ______ day of __________, 20__.</p>
                <div class="filing-closing__signature-box">
                    <p class="filing-closing__name">State's Attorney/Attorney General</p>
                </div>
        </div>            </div>
`),
  props: ['signature','stipulated']

})


var app = new Vue({
  el: '#filing-app',
  data: {
    message: 'Hello Vue!',
    saved: {
    	defName: "",
    	defAddress: ["",""],
    	defDOB: "",
    	counts: [],
    },
    filings: "",
    filingStats: "",
  },
  mounted() {
  	console.log('App mounted!');
  	chrome.storage.local.get('expungevt', function (result) {
        var data = result.expungevt[0]
        app.saved = data
        app.filings = app.groupCountsIntoFilings(app.saved.counts)
    });

  },
  methods:{
    groupCountsIntoFilings: function(counts){

      console.log("groupingFilings");      
      var filingCounties = this.groupByCounty(counts)

      console.log("there are "+filingCounties.length+" counties for " +counts.length +" counts");
      //group into filing
      var groupedFilings = []
      for (var county in filingCounties){
        var countyName = filingCounties[county]
        var allCountsForThisCounty = counts.filter(count => count.county == countyName)
        var filingsForThisCounty = this.groupByFilingType(allCountsForThisCounty)


        console.log("there are "+filingsForThisCounty.length+" different filings needed in "+countyName)
        console.log(filingsForThisCounty)

        var allFilingsForThisCountyObject = []
        for (var filing in filingsForThisCounty){
          var filingType = filingsForThisCounty[filing]
          if (this.isEligible(filingType)){
            var filingObject = this.makeFilingObject(counts,countyName,filingType)
            allFilingsForThisCountyObject.push(filingObject)
          }
        }

        groupedFilings.push(
          {county:countyName,
          filings:allFilingsForThisCountyObject
        });
      }
      return groupedFilings;
    },
    groupByCounty: function(counts) {

      var allCounties = counts.map(function(count) {
        return count.county
      });
      return allCounties.filter((v, i, a) => a.indexOf(v) === i)
    },
    groupByFilingType:function(counts) {
        var allCounts = counts.map(function(count) {
          return count.filingType
        });
        return allCounts.filter((v, i, a) => a.indexOf(v) === i)
    },
    allDocketNums: function (counts){
        allDocketNums = counts.map(function(count) {
              return count.docketNum + " " +count.docketCounty
            });

        return allDocketNums.filter((v, i, a) => a.indexOf(v) === i);
    },
    allDocketNumsObject: function(counts){
      var docketNums = this.allDocketNums(counts);

      return docketNums.map(function (docketNum){
        return {num:docketNum}
      });
    }
    ,
    isStipulated: function(filingType){
      return (
        filingType == "StipExC" || 
        filingType == "StipExNC" || 
        filingType == "StipSC");
    },
    isEligible: function(filingType){
      return (
        filingType != "X");
    },
    filingNameFromType: function(filingType){
      switch (filingType) {
        case "StipExC":
          return "Stipulated Petition to Expunge Conviction"
        case "ExC":
          return "Petition to Expunge Conviction"
        case "StipExNC":
          return "Stipulated Petition to Expunge Non Conviction"
        case "ExNC":
          return "Petition to Expunge Conviction"
        case "StipSC":
          return "Stipulated Petition to Seal Conviction"
        case "SC":
          return "Petition to Seal Conviction"
        default:
          return "Petition";
      }
    },
    makeNumCountsString: function(num){
      if (num > 1) {
          return num+" Counts"
        } else {
          return "1 Count"
        }
    },
    makeFilingObject(counts,county,filingType){

      var countsOnThisFiling = counts.filter(count => count.county == county && count.filingType == filingType)

      var numCounts = countsOnThisFiling.length
      console.log("numcounts: "+numCounts)
      var isMultipleCounts = numCounts > 1
      
      return {
        id:filingType+county,
        type: filingType,
        title: this.filingNameFromType(filingType),
        county: county,
        numCounts: numCounts,
        multipleCounts: isMultipleCounts,
        numCountsString: this.makeNumCountsString(numCounts),
        isStipulated: this.isStipulated(filingType),
        isEligible: this.isEligible(filingType),
        docketNums: this.allDocketNumsObject(countsOnThisFiling),
        counts:countsOnThisFiling,
        response:""
      }
    },
    makeAllFilings: function(counts){
    }
  },
  computed: {
  	petitoner: function () {
      return {
  		name: this.saved.defName,
  		dob: this.saved.defDOB,
  		address1: this.saved.defAddress[0],
  		address2: this.saved.defAddress[1]
  	  }
    },
    numCountsIneligible: function () {
      return this.saved.counts.filter(count => count.filingType == "X").length
    }
  },
  filters: {
    uppercase: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    lowercase: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toLowerCase() + value.slice(1)
    }
  }
})

//testing data
  var multiCounty = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","filingType": "ExNC","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","filingType": "ExNC","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Adsr","county":"Addison","filingType": "ExNC","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","filingType": "StipSC","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Adsr","county":"Addison","filingType": "X","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};
  var singleCounty = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Addison","filingType": "X","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};
  var singleCount = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","filingType": "ExNC","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"}]};

//app.saved = multiCounty
//app.filings = app.groupCountsIntoFilings(app.saved.counts)
