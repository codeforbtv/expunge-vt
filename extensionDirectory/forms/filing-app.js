
document.addEventListener("DOMContentLoaded", function () {
    initButtons();
}, false);



function initButtons(){
    //document.getElementById('js-make-pdf').addEventListener('click', makePDF);
    document.getElementById('js-print').addEventListener('click', printDocument);

}
function printDocument(){
    window.print();
}



Vue.component('docket-caption', {
  template: '<div class="caption"> \
			<div class="capNames">\
			<p>State of Vermont,</p>\
			<p>v.</p>\
			<p><span id="petitionerName">{{name}}</span></p>\
			<p><i>Petitioner</i></p>\
			</div>\
			<div class="capParens">\
			<p>)</p>\
			<p>)</p>\
			<p>)</p>\
			<p>)</p>\
			</div>\
			</div>',
	props: ['name']

})



//Petition To Expunge Conviction

//var staticData = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"totalCounts":2,"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};

var app = new Vue({
  el: '#filing-app',
  data: {
    message: 'Hello Vue!',
    saved: {
    	defName: "",
    	defAddress: "",
    	defDOB: "",
    	counts: [],
    },
    response: ""
  },
  mounted() {
  	console.log('App mounted!');
  	/*chrome.storage.local.get('expungevt', function (result) {
        var data = result.expungevt[0]
        app.saved = data
        console.log(data);
    });*/
    //app.saved = JSON.stringify(staticData)

  },
  computed: {
  	petitoner: function () {
      // `this` points to the vm instance
      return {
  		name: this.saved.defName,
  		dob: this.saved.defDOB,
  		address1: this.saved.defAddress[0],
  		address2: this.saved.defAddress[1]
  	  }
    },
    filing: function () {
      // `this` points to the vm instance
      var numCounts = this.saved.counts.length
      console.log("numcounts:"+numCounts)
      var isMultipleCounts = numCounts > 1
      function countString(num) {
  			if (num > 1) {
  				return num+" Counts"
  			} else {
  				return "1 Count"
  			}
  		}
      return {
    		title: "Stipulated Petition To Expunge Non Conviction",
    		courtCounty: this.county,
    		numCounts: numCounts,
    		multipleCounts: isMultipleCounts,
    		numCountsString: countString(numCounts),
        isStipulated: true
  	  }
    },
    county: function(){
      var count = this.saved.counts[0]
      if (count !== undefined && count.county !== undefined) {
       return count.county
      }
      return "";
    },
    allDocketNums: function (){
       //add multiple docket numbers
       var counts = this.saved.counts
    docketArray = counts.map(function(count) {
              return {
                num: count.docketNum, 
                county: count.docketCounty
              }
            });

    return docketArray.filter((v, i, a) => a.indexOf(v) === i);
    }
  }
})
  var multiCounty = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Adsr","county":"Addison","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};
  var singleCounty = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};
  var singleCount = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"}]};

app.saved = singleCount