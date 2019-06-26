document.addEventListener("DOMContentLoaded", function () {
    initButtons();
    initTextAreaAutoExpand();
    initSmoothScroll();
    detectChangesInLocalStorage();
}, false);

function initAfterVue(){
  //sets intital height of all text areas to show all text.
  setInitialExpandForTextAreas();
  initScrollDetection()
}
function initAfterFilingRefresh(){
  setInitialExpandForTextAreas()
}

function initTextAreaAutoExpand(){
  document.addEventListener('input', function (event) {
  if (event.target.tagName.toLowerCase() !== 'textarea') return;
  autoExpand(event.target);
  }, false);
}

function initButtons(){
  document.addEventListener('click', function (event) {
    if (event.target.id === 'js-print') printDocument();
  }, false);
}

function initSmoothScroll(){
  var scroll = new SmoothScroll('a[href*="#"]',{
    offset: 150,
    durationMax: 300
  });
}
function detectChangesInLocalStorage(){
  chrome.storage.onChanged.addListener(function(changes, namespace) {
  var storageChange = changes['expungevt'];
  if (storageChange === undefined) return;

  if (storageChange.newValue === undefined) {
      app.clearAll();
      return
  };

  app.saveAndParseData(storageChange.newValue[0])

  });
}
function initScrollDetection() {
  //initates the scrollspy for the filing-nav module.
  var spy = new Gumshoe('#filing-nav a',{
      nested: true,
      nestedClass: 'active-parent',
      offset: 200, // how far from the top of the page to activate a content area
      reflow: false, // if true, listen for reflows
    });
}
function setInitialExpandForTextAreas(){
  //sets the default size for all text areas based on their content.
  //call this after vue has initialized and displayed
  var textAreas = document.getElementsByTagName("textarea");
  for (var index in textAreas) {
    var textArea = textAreas[index]
    if (textArea === undefined) return;
    autoExpand(textArea);
  }
}

function autoExpand(field) {
  if (field === undefined) return;
  if (field.style === undefined) return;
  // Reset field height

  field.style.height = 'inherit';
  // Get the computed styles for the element
  var computed = window.getComputedStyle(field);

  // Calculate the height
  var height = parseInt(computed.getPropertyValue('border-top-width'), 5)
               + parseInt(computed.getPropertyValue('padding-top'), 5)
               + field.scrollHeight
               + parseInt(computed.getPropertyValue('padding-bottom'), 5)
               + parseInt(computed.getPropertyValue('border-bottom-width'), 5)
               - 8;

  field.style.height = height + 'px';
};


function printDocument(){
    window.print();
}

//Vue Components

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
});

Vue.component('filing-nav', {
  template: (`<div class="filing-nav no-print" id="filing-nav"> 
      <ol>
        <li v-for="group in filings" class="filing-nav__parent-link">
        <a href v-bind:href="'#'+group.county">{{group.county}}</a>
        <ol>
          <li v-for="filing in group.filings" class="filing-nav__child-link"><a v-bind:href="'#'+filing.id">{{filing.title}}</a>
          <p class="filing-nav__counts">{{filing.numCountsString}}, {{filing.numDocketsString}}</p>
          </li>
        </ol>
        </li>
        <li class="filing-nav__parent-link">
          <a href="#extra-documents">Extra Documents</a>
          <ol>
            <li class="filing-nav__child-link">
              <a href="#clinic-checkout">Clinic Summary Sheet</a>
            </li>
          </ol>
        </li>
      </ol>
      </div>
      `),
  props: ['filings']
});


Vue.component('filing-footer', {
  template: (`<div class="filing-closing">
              <p class="filing-closing__salutation">Respectfully requested,</p>
              <div class="filing-closing__signature-area">
                  <div class="filing-closing__signature-box">
                      <p class="filing-closing__name">{{signature.name}}, Petitioner</p>
                      <p class="filing-closing__petitioner-address" v-html="signature.address"></p>
                  </div>
                  <div class="filing-closing__date-box">
                      <p>Date</p>
                  </div>
              </div>

              <div class="stipulated-closing" v-if="stipulated">
                  <p class="stipulated-closing__dates"><span class="bold">Stipulated and agreed</span> this <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, 20<span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
                  <div class="filing-closing__signature-box">
                      <p class="filing-closing__name">State's Attorney/Attorney General</p>
                  </div>
              </div>
          </div>

`),
  props: ['type','signature','stipulated']
});

Vue.component('filing-dated-city', {
  template: (`
    <p class="filing-dated-city indent">Dated in <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, this <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, 20<span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
  `)
});
//vue app

var app = new Vue({
  el: '#filing-app',
  data: {
    groupCounts: true,
    saved: {
    	defName: "",
    	defAddress: ["",""],
    	defDOB: "",
    	counts: [],
    },
    filings: "",
    ineligible:"",
    noAction: "",
    responses: {}
  },
  watch: {
    'responses': {
     handler(){
       app.saveResponses()
     },
     deep: true
   },
    'groupCounts': {
      handler(){
        app.filings = app.groupCountsIntoFilings(app.saved.counts, this.groupCounts);
        app.$nextTick(function () {
        //call any vanilla js functions after update.
          initAfterFilingRefresh();
        })
      }
    }
  },

  mounted() {
  	console.log('App mounted!');
  	chrome.storage.local.get('expungevt', function (result) {
        //test if we have any data
        if (result.expungevt === undefined) return;
        //load the data
        
        var data = result.expungevt[0]
        
        var loadResponsesCallback = (function(){ 
          app.saveAndParseData(data) 
        });
        
        app.loadResponses(loadResponsesCallback);

    });
  },
  methods:{
    saveAndParseData: function(data) {
                console.log("save and parse");

        app.saved = data
        //parse the data
        app.filings = app.groupCountsIntoFilings(data.counts, this.groupCounts) //counts, groupCountsFromMultipleDockets=true
        app.ineligible = app.groupIneligibleCounts(data.counts)
        app.noAction = app.groupNoAction(data.counts)
        app.$nextTick(function () {
            app.updatePageTitle();
            //call any vanilla js functions that need to run after vue is all done setting up.
            initAfterVue();
        })
    },
    saveResponses: function(){
      var responses = app.responses
      console.log("save responses")
      chrome.storage.local.set({
        expungevtResponses: responses
      });
    },
    loadResponses: function(callback){
      console.log("load responses")

      chrome.storage.local.get('expungevtResponses', function (result) {
        //test if we have any data

        if (result.expungevtResponses !== undefined) {
          //load the data
          var responses = result.expungevtResponses
          app.responses = responses; 
        } else {
          app.responses = {};
        }

        callback();
    });
    },
    groupCountsIntoFilings: function(counts, groupDockets = true){
      
      // get all counties that have counts associated with them 
      var filingCounties = this.groupByCounty(counts)

      console.log("there are "+filingCounties.length+" counties for " + counts.length +" counts");
      
      //create an array to hold all county filing objects
      var groupedFilings = []
      
      //iterate through all counties and create the filings
      for (var county in filingCounties){
        var countyName = filingCounties[county]
        
        //filter all counts to the ones only needed for this county
        var allEligibleCountsForThisCounty = counts.filter(count => count.county == countyName && this.isFileable(count.filingType))
        
        //figure out the filing types needed for this county.
        var filingsForThisCounty = this.groupByFilingType(allEligibleCountsForThisCounty)

        console.log("there are "+filingsForThisCounty.length +" different filings needed in "+ countyName)
        console.log(filingsForThisCounty)

        //if there are no filings needed for this county, move along to the next one.
        if (filingsForThisCounty.length == 0) continue;

        //create an array to hold all of the filing objects for this county
        var allFilingsForThisCountyObject = []

        //add the notice of appearance filing to this county because we have petitions to file
        var noticeOfAppearanceObject = this.createNoticeOfAppearanceFiling(countyName, allEligibleCountsForThisCounty)
        allFilingsForThisCountyObject.push(noticeOfAppearanceObject)

        //iterate through the filing types needed for this county and push them into the array
        for (var filingIndex in filingsForThisCounty){
          console.log(filingIndex)
          var filingType = filingsForThisCounty[filingIndex]

          //if the filing is not one we're going to need a petition for, let's skip to the next filing type
          if (!this.isFileable(filingType)) continue;
            console.log("is fileable")

          //create the filing object that will be added to the array for this county
          var filingObject = this.filterAndMakeFilingObject(counts,countyName,filingType)

          //determine if we can use the filling object as is, or if we need to break it into multiple petitions.
          if (groupDockets || filingObject.numDockets == 1) {
              allFilingsForThisCountyObject.push(filingObject);
              this.createResponseObjectForFiling(filingObject.id)
          
          } else {
            //break the filing object into multiple petitions
            for (var docketNumIndex in filingObject.docketNums) {
              var docketNumUnique = filingObject.docketNums[docketNumIndex].num;
              var brokenOutFilingObject = this.filterAndMakeFilingObject(filingObject.counts,countyName,filingType,docketNumUnique)
              allFilingsForThisCountyObject.push(brokenOutFilingObject);
              this.createResponseObjectForFiling(brokenOutFilingObject.id)

            }
          }
        }

        //add all filings for this county to the returned filing object.
        groupedFilings.push(
          {county:countyName,
          filings:allFilingsForThisCountyObject
        });
      }
      

      return groupedFilings;
    },
    createResponseObjectForFiling: function(id){
      console.log("testing for " + id);
      if (app.responses[id] === undefined) {
        console.log("creating default for " + id);
        Vue.set(app.responses, id, "")
      }
    },
    createNoticeOfAppearanceFiling: function(county, counts){
        return this.makeFilingObject(counts, 'PSNoA', county);
    },
    groupIneligibleCounts: function(counts){
      var ineligibleCounts = counts.filter(count => count.filingType == "X" )
      return ineligibleCounts;
    },
    groupNoAction: function(counts){
      var noActionCounts = counts.filter(count => count.filingType == "" )
      return noActionCounts;
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
    allDocketNumsObject: function (counts){

        allDocketNums = counts.map(function(count) {
          return {num:count.docketNum, county:count.docketCounty, string: count.docketNum + " " + count.docketCounty}
        });

        //filter the docket number object array to make it unique
        var result = allDocketNums.filter((e, i) => {
          return allDocketNums.findIndex((x) => {
          return x.num == e.num && x.county == e.county;}) == i;
        });

        return result;
    },
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
    isFileable: function(filingType){
      return (this.isSupported(filingType) && this.isEligible(filingType));
    },
    isSupported: function(filingType){
      switch (filingType) {
        case "PSNoA": //Pro Se Notice of Appearance 
        case "StipExC":
        case "ExC":
        case "StipExNC":
        case "ExNC":
        case "StipSC":
        case "SC":
        case "X":
          return true;
        default:
          return false;
      }
    },
    filingNameFromType: function(filingType){
      switch (filingType) {
        case "PSNoA":
          return "Notice of Appearance"
        case "StipExC":
          return "Stipulated Petition to Expunge Conviction"
        case "ExC":
          return "Petition to Expunge Conviction"
        case "StipExNC":
          return "Stipulated Petition to Expunge Non-Conviction"
        case "ExNC":
          return "Petition to Expunge Non-Conviction"
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
    makeNumDocketsString: function(num){
      if (num > 1) {
          return num+" Dockets"
        } else {
          return "1 Docket"
        }
    },
    addDocketNumberToDescriptions: function(counts){
      var allCountsWithUpdatedDescriptions = counts.map(function(count) {
          count["descriptionFull"] = count.description + " (" + count.docketNum + " " + count.docketCounty +")";
          return count
        });
      return allCountsWithUpdatedDescriptions

    },
    filterAndMakeFilingObject: function(counts,county,filingType,docketNum=""){
      console.log("in filter" + docketNum)
      var countsOnThisFiling = counts.filter(count => count.county == county && count.filingType == filingType && (docketNum =="" ||  docketNum == count.docketNum));
      return this.makeFilingObject(countsOnThisFiling, filingType, county);
    },
    makeFilingObject: function(counts, filingType, county){
      var countsOnThisFiling = this.addDocketNumberToDescriptions(counts);
      var numCounts = countsOnThisFiling.length;
      var docketNums = this.allDocketNumsObject(countsOnThisFiling)
      var numDockets = docketNums.length;
      var isMultipleCounts = numCounts > 1;
      var filingId = filingType+"-"+county+"-"+docketNums[0].num;

      return {
        id:filingId,
        type: filingType,
        title: this.filingNameFromType(filingType),
        county: county,
        numCounts: numCounts,
        numDockets: numDockets,
        multipleCounts: isMultipleCounts,
        numCountsString: this.makeNumCountsString(numCounts),
        numDocketsString: this.makeNumDocketsString(numDockets),
        isStipulated: this.isStipulated(filingType),
        isEligible: this.isEligible(filingType),
        docketNums: docketNums,
        counts:countsOnThisFiling,
      }
    },
    updatePageTitle: function(){
      var title = "Filings for "+this.petitioner.name
      document.title = title;
    },
    nl2br: function(rawStr) {
      var breakTag = '<br>';      
      return (rawStr + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');  
    },
    clearAll: function(){
      document.location.reload()
    },
    linesBreaksFromArray: function(array) {
      var string = "";
      var delimiter = "\r\n";
      var i;
      for (i = 0; i < array.length; i++) { 
        if (i > 0 ) 
          {
            string += delimiter;
          }
        string += array[i];
      }
      return string;
    }
  },
  computed: {
  	petitioner: function () {
      return {
  		name: this.saved.defName,
  		dob: this.saved.defDOB,
  		address: this.nl2br(this.linesBreaksFromArray(this.saved.defAddress))
  	  }
    },
    numCountsIneligible: function () {
      return this.ineligible.length;
    },
    countsExpungedNC: function (data) {
      const excCounts = data.saved.counts.filter(count => count.filingType === "ExNC" || count.filingType === "StipExNC");
      console.log(excCounts)
      return excCounts;
    },
    countsExpungedC: function (data) {
      const excCounts = data.saved.counts.filter(count => count.filingType === "ExC" || count.filingType === "StipExC");
      return excCounts;
    },
    countsSealC: function (data) {
      const excCounts = data.saved.counts.filter(count => count.filingType === "SC" || count.filingType === "StipSC");
      return excCounts;
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
//  var multiCounty = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","filingType": "ExNC","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","filingType": "ExNC","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Adsr","county":"Addison","filingType": "ExNC","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","filingType": "StipSC","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Adsr","county":"Addison","filingType": "X","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};
//  var singleCounty = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Addison","filingType": "X","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"},{"countNum":"2","docketNum":"16-3-97","docketCounty":"Cncr","county":"Chittenden","titleNum":"13","sectionNum":"7559(E) VRCRP 42","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Dismissed by state","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"VIOLATION OF CONDITIONS OF RELEASE"}]};
//  var singleCount = {"defName":"George D. Papadopoulos","defDOB":"8/19/1987","defAddress":["FCI Oxford","Oxford WI 53952"],"counts":[{"countNum":"1","docketNum":"15-2-97","docketCounty":"Cncr","county":"Chittenden","filingType": "ExNC","titleNum":"13","sectionNum":"2502","offenseClass":"mis","dispositionDate":"02/13/97","offenseDisposition":"Plea guilty","allegedOffenseDate":"10/25/96","arrestCitationDate":"12/06/96","description":"ATTEMPTED PETIT LARCENY"}]};

//app.saved = multiCounty
//app.filings = app.groupCountsIntoFilings(app.saved.counts)
