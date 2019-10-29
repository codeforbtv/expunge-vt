const maxCountsOnNoA = 10;
Vue.config.devtools = true

document.addEventListener("DOMContentLoaded", function () {
    initButtons();
    initTextAreaAutoExpand();
    //initSmoothScroll();
}, false);

function initAfterVue(){
  //sets intital height of all text areas to show all text.
  setInitialExpandForTextAreas();
  //initScrollDetection()
}

function initAfterFilingRefresh(){
  setInitialExpandForTextAreas();
  //initScrollDetection();
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
    if (event.target.id === 'js-export') downloadCSV({ data_array: app.csvData, filename: app.csvFilename });
  }, false);
}
/*
function initSmoothScroll(){
  var scroll = new SmoothScroll('a[href*="#"]',{
    offset: 150,
    durationMax: 300
  });
}
*/
function detectChangesInLocalStorage(){
  chrome.storage.onChanged.addListener(function(changes, namespace) {
  var storageChange = changes['counts'];
  if (storageChange === undefined) return;
  if (storageChange.newValue === undefined) {
      app.clearAll();
      return
  };
    app.loadAll(function(){})
  });
}
/*
function initScrollDetection() {
  //initates the scrollspy for the filing-nav module.
  var spy = new Gumshoe('#filing-nav a',{
      nested: true,
      nestedClass: 'active-parent',
      offset: 200, // how far from the top of the page to activate a content area
      reflow: true, // if true, listen for reflows
    });
}
*/
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
      </div>
      `),
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
  template: (`<div class="stipulated-closing" v-if="stipulated">
                  <p class="stipulated-closing__dates"><span class="bold">Stipulated and agreed</span> this <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, 20<span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
                  <div class="filing-closing__signature-box">
                      <p class="filing-closing__name">State's Attorney/Attorney General</p>
                  </div>
              </div>
          </div>
          `),
  props: ['stipulated']
});

Vue.component('filing-dated-city', {
  template: (`
    <p class="filing-dated-city indent">Dated in <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, this <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> day of <span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>, 20<span class="fill-in">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>.</p>
  `)
});

//Vue app
var app = new Vue({
  el: '#filing-app',
  data: {
    settings:{
      groupCounts: true,
      proSe: true,
      attorney:"",
      attorneyAddress:"",
      attorneyPhone:""
    },
    saved: {
    	defName: "",
    	defAddress: [""],
    	defDOB: "",
    	counts: []
    },
    responses: {}
  },
  watch: 
  {
    'responses': {
       handler(){
         app.saveResponses()
       },
       deep: true
    },
    'settings': {
      handler(){
        console.log("settings updated")
        this.saveSettings()
        app.$nextTick(function () 
        {
        //call any vanilla js functions after update.
          //initAfterFilingRefresh();
        })
      },
      deep:true
    },
    'saved': {
      handler(){
        console.log("counts updated")
        this.saveCounts()
        app.$nextTick(function () 
        {
        //call any vanilla js functions after update.
          //initAfterFilingRefresh();
        })
      },
      deep:true
    }
  },
  mounted() {
  	console.log('App mounted!');
    this.loadAll();
    detectChangesInLocalStorage();

  },
  methods:{
    saveSettings: function(){
      console.log("save settings", app.settings)
      chrome.storage.local.set({
        settings: app.settings
      });
    },
    saveResponses: function(){
      console.log("save responses")
      chrome.storage.local.set({
        responses: app.responses
      });
    },
    saveCounts: function(){
      console.log("saving counts")
        chrome.storage.local.set({
          counts: app.saved
        });
    },
    loadAll: function(callback){

      if (callback === undefined){
        callback = function(){}
      }

        chrome.storage.local.get(function (result) {
        //test if we have any data
          console.log("loading all");
          console.log(JSON.stringify(result))
          if (result.counts !== undefined) {
              app.saved = result.counts
              app.addFullDescriptionToCounts()
          }
          if (result.settings !== undefined && result.settings !== "") {
            console.log("settings found")
            console.log(JSON.stringify(result.settings))
            Vue.set(app, "settings", result.settings)
          } else {
            console.log("No settings found, saving default settings")
            this.saveSettings()
          }
          if (result.responses !== undefined) {
              app.responses = result.responses
          }
          
          callback();
          app.$nextTick(function () {
            app.updatePageTitle();
            //call any vanilla js functions that need to run after vue is all done setting up.
            //initAfterVue();
          })
        })
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

        //if there are no filings needed for this county, move along to the next one.
        if (filingsForThisCounty.length == 0) continue;

        //create an array to hold all of the filing objects for this county
        var allFilingsForThisCountyObject = []

        //add the notice of appearance filing to this county because we have petitions to file
        //we can only fit a maximum of ~10 docket numbers, so we will create multiple Notices of Appearance to accomodate all docket numbers.
        var maxDocketsPerNoA = maxCountsOnNoA || 10;
        var allEligibleCountsForThisCountySegmented = this.segmentCountsByMaxDocketNumber(allEligibleCountsForThisCounty, maxDocketsPerNoA);

        //iterate through our array of segmented count arrays to create all of the NoAs needed.
        for (var NoAindex in allEligibleCountsForThisCountySegmented){
          var NoACounts = allEligibleCountsForThisCountySegmented[NoAindex];
          var noticeOfAppearanceObject = this.createNoticeOfAppearanceFiling(countyName, NoACounts);
          allFilingsForThisCountyObject.push(noticeOfAppearanceObject);
        }

        //iterate through the filing types needed for this county and push them into the array
        for (var filingIndex in filingsForThisCounty){
          var filingType = filingsForThisCounty[filingIndex];

          //if the filing is not one we're going to need a petition for, let's skip to the next filing type
          if (!this.isFileable(filingType)) continue;

          //create the filing object that will be added to the array for this county
          var filingObject = this.filterAndMakeFilingObject(counts,countyName,filingType);
          
          //determine if we can use the filling object as is, or if we need to break it into multiple petitions.
          //this is determined based on the state of the UI checkbox for grouping.
          if (groupDockets || filingObject.numDocketSheets == 1) {
              allFilingsForThisCountyObject.push(filingObject);
              this.createResponseObjectForFiling(filingObject.id);
          
          } else {
            //break the filing object into multiple petitions
            for (var docketNumIndex in filingObject.docketSheetNums) {
              var docketSheetNumUnique = filingObject.docketSheetNums[docketNumIndex].num;
              var brokenOutFilingObject = this.filterAndMakeFilingObject(filingObject.counts,countyName,filingType,docketSheetNumUnique)
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
    segmentCountsByMaxDocketNumber: function(counts, max){
          var allDocketNums = this.allDocketNumsObject(counts);

          var numSegments = Math.ceil(allDocketNums.length/max);
          var result = []

          for (var i=0; i<numSegments ; i++ ){

            var start = i*max;
            var end = Math.min(((i*max)+(max)), allDocketNums.length);

            var docketObjectsThisSegment = allDocketNums.slice(start, end);

            var docketsThisSegment = docketObjectsThisSegment.map(function(docket){   
              return docket.num   
            });

            var segment = counts.filter(f => docketsThisSegment.includes(f.docketNum));
            result.push(segment)
          }

          return result;
    },
    createResponseObjectForFiling: function(id){
      if (app.responses[id] === undefined) {
        Vue.set(app.responses, id, "")
      }
    },
    createNoticeOfAppearanceFiling: function(county, counts){
      return this.makeFilingObject(counts, 'NoA', county);
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
    allDocketSheetNumsObject: function (counts){

      allDocketSheetNums = counts.map(function(count) {
        return {num:count.docketSheetNum}
      });

      //filter the docket number object array to make it unique
      var result = allDocketSheetNums.filter((e, i) => {
        return allDocketSheetNums.findIndex((x) => {
        return x.num == e.num}) == i;
      });

      return result;
    },
    isStipulated: function(filingType){
      return (
        filingType == "StipExC" || 
        filingType == "StipExNC" ||
        filingType == "StipExNCrim" || 
        filingType == "StipSC" ||  
        filingType == "StipSDui");
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
        case "NoA":
        case "StipExC":
        case "ExC":
        case "StipExNC":
        case "ExNC":
        case "StipExNCrim":
        case "ExNCrim":
        case "StipSC":
        case "StipSDui":
        case "SC":
        case "SDui":
        case "X":
          return true;
        default:
          return false;
      }
    },
    filingNameFromType: function(filingType){
      switch (filingType) {
        case "NoA":
          return "Notice of Appearance"
        case "StipExC":
          return "Stipulated Petition to Expunge Conviction"
        case "ExC":
          return "Petition to Expunge Conviction"
        case "StipExNC":
          return "Stipulated Petition to Expunge Non-Conviction"
        case "ExNC":
          return "Petition to Expunge Non-Conviction"
        case "StipExNCrim":
          return "Stipulated Petition to Expunge Conviction"
        case "ExNCrim":
          return "Petition to Expunge Conviction"
        case "StipSC":
          return "Stipulated Petition to Seal Conviction"
        case "SC":
          return "Petition to Seal Conviction"
        case "StipSDui":
          return "Stipulated Petition to Seal Conviction"
        case "SDui":
          return "Petition to Seal Conviction"
        case "X":
          return "Ineligible"
        default:
          return "None";
      }
    },
    offenseAbbreviationToFull: function(offenseClass) {
      switch (offenseClass) {
        case "mis":
          return "Misdemeanor"
        case "fel":
          return "Felony"
        default:
          return "";
      }
    },
    addFullDescriptionToCounts: function(){
      for (countIndex in app.saved.counts) {
          var count = app.saved.counts[countIndex];
          var descriptionFull = count.description + " (" + count.docketNum + " " + count.docketCounty +")";
          Vue.set(app.saved.counts[countIndex],"descriptionFull",descriptionFull);
      }
    },
    filterAndMakeFilingObject: function(counts,county,filingType,docketSheetNum=""){
      var countsOnThisFiling = counts.filter(count => count.county == county && count.filingType == filingType && (docketSheetNum =="" ||  docketSheetNum == count.docketSheetNum));
      return this.makeFilingObject(countsOnThisFiling, filingType, county);
    },
    makeFilingObject: function(counts, filingType, county){
      var countsOnThisFiling = counts;
      var numCounts = countsOnThisFiling.length;
      var docketNums = this.allDocketNumsObject(countsOnThisFiling);
      var numDockets = docketNums.length;
      var docketSheetNums = this.allDocketSheetNumsObject(countsOnThisFiling);
      var numDocketSheets = docketSheetNums.length;
      var isMultipleCounts = numCounts > 1;
      var filingId = filingType+"-"+county+"-"+docketNums[0].num;

      return {
        id: filingId,
        type: filingType,
        title: this.filingNameFromType(filingType),
        county: county,
        numCounts: numCounts,
        numDockets: numDockets,
        numDocketSheets: numDocketSheets,
        multipleCounts: isMultipleCounts,
        numCountsString: this.pluralize("Count",numCounts),
        numDocketsString: this.pluralize("Docket",numDockets),
        isStipulated: this.isStipulated(filingType),
        isEligible: this.isEligible(filingType),
        docketNums: docketNums,
        docketSheetNums: docketSheetNums,
        counts: countsOnThisFiling,
      }
    },
    newCount: function(event){
      this.saved.counts.push({ description: 'Count' })
    },
    updatePageTitle: function(){
      var title = "Filings for "+this.petitioner.name
      document.title = title;
    },
    clearAll: function(){
      document.location.reload()
    },
    nl2br: function(rawStr) {
      var breakTag = '<br>';      
      return (rawStr + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');  
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
    },
    pluralize: function(word, num){
      var phrase = num+" "+word;
      if (num > 1) return phrase+"s";
      return phrase;
    },
    slugify: function(string) {
      return string.replace(/\s+/g, '-').toLowerCase();
    },
  
    openPetitionsPage: function() {

    chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
          let index = tabs[0].index;
          chrome.tabs.create({
              url: chrome.extension.getURL('./filings.html'),
              index: index + 1,
          })
      })
    },
    openManagePage: function (element) {

        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            let index = tabs[0].index;
            chrome.tabs.create({
                url: chrome.extension.getURL('./manage-counts.html'),
                index: index + 1,
            })
        })
      },
  
   addDocketCounts: function() {
    chrome.tabs.executeScript(null, { file: 'payload.js' });
  },
  confirmClearData: function (element) {

    if (confirm("Are you sure you want to clear all data for this petitioner?"));
    {
        chrome.storage.local.remove(['counts','responses'])
    }
  }
},
  computed: {
  	petitioner: function () {
      return {
  		name: this.saved.defName,
  		dob: this.saved.defDOB,
  		address: this.nl2br(this.saved.defAddress)
      //addressString: this.saved.defAddress.join(", ")
  	  }
    },
    filings: function (){
      var shouldGroupCounts = true;
      if (this.settings.groupCounts !== undefined) {
        group = this.settings.groupCounts;
      }
      return this.groupCountsIntoFilings(this.saved.counts, shouldGroupCounts) //counts, groupCountsFromMultipleDockets=true
    },
    ineligible: function(){
      return this.groupIneligibleCounts(this.saved.counts);
    },
    noAction: function(){
      return this.groupNoAction(app.saved.counts);
    },
    numCountsIneligible: function () {
      return this.ineligible.length;
    },
    countsExpungedNC: function (data) {
      return this.saved.counts.filter(count => count.filingType === "ExNC" || count.filingType === "StipExNC");
    },
    countsExpungedC: function (data) {
      return this.saved.counts.filter(count => count.filingType === "ExC" || count.filingType === "StipExC");
    },
    countsExpungedNCrim: function (data) {
      return this.saved.counts.filter(count => count.filingType === "ExNCrim" || count.filingType === "StipExNCrim");
    },
    countsSealC: function (data) {
      return this.saved.counts.filter(count => count.filingType === "SC" || count.filingType === "StipSC");
    },
    countsSealDui: function (data) {
      return this.saved.counts.filter(count => count.filingType === "SDui" || count.filingType === "StipSDui");
    },
    numDockets: function(){
      var numDockets = this.saved.counts.filter((e, i) => {
        return this.saved.counts.findIndex((x) => {
        return x.docketNum == e.docketNum && x.county == e.county;}) == i;
      });
      return numDockets.length
    },
    csvFilename:function(){
      var date = new Date()
      return this.slugify("filings for "+app.petitioner.name + " " + date.toDateString() + ".csv");
    },
    csvData:function(){

      return this.saved.counts.map(function(count) {
        return {
          Petitioner_Name: app.petitioner["name"], 
          Petitioner_DOB: app.petitioner.dob, 
          Petitioner_Address: app.petitioner.addressString, 
          Petitioner_Phone: app.responses.phone, 
          County: count.county, 
          Docket_Sheet_Number:count.docketSheetNum, 
          Count_Docket_Number:count.docketNum, 
          Filing_Type:app.filingNameFromType(count.filingType), 
          Count_Description:count.description, 
          Count_Statute_Title: count.titleNum, 
          Count_Statute_Section: count.sectionNum, 
          Offense_Class:app.offenseAbbreviationToFull(count.offenseClass), 
          Offense_Disposition:count.offenseDisposition, 
          Offense_Disposition_Date:count.dispositionDate}
      });
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
    },
    sinceNow: function (value) {
      if (!value) return ''
      
      let fromTime = moment(value).diff(moment(), "milliseconds")
      let duration = moment.duration(fromTime)
      let years = duration.years() / -1
      let months = duration.months() / -1
      let days = duration.days() / -1
      if (years > 0) {
          var Ys = years == 1 ? years + "y " : years + "y "
          var Ms = months == 1 ? months + "m " : months + "m "
          return Ys + Ms
      } else {
          if (months > 0)
              return months == 1 ? months + "m " : months + "m "
          else
              return days == 1 ? days + "d " : days + "d "
      }
    },
    dateFormatSimple: function (value){
        if (!value) return ''
        return moment(value).format("MM/DD/YYYY")


    }
  }
  }
});