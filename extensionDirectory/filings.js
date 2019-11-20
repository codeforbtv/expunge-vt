const maxCountsOnNoA = 10;
Vue.config.devtools = true

$(document).on('keydown', function(e) {
  if((e.ctrlKey || e.metaKey) && (e.key == "p" || e.charCode == 16 || e.charCode == 112 || e.keyCode == 80) ){
      e.cancelBubble = true;
      e.preventDefault();
      e.stopImmediatePropagation();
      app.printDocument();
  }
});

function initAfterVue(){
  //sets intital height of all text areas to show all text.
  console.log(document.getElementsByTagName('body')[0].id);
  if (document.getElementsByTagName('body')[0].id === "filing-page"){
      initScrollDetection()
      setInitialExpandForTextAreas();
      initTextAreaAutoExpand();
      initSmoothScroll();

  }
}

function initAfterFilingRefresh(){
  setInitialExpandForTextAreas();
  initScrollDetection();
}

function initTextAreaAutoExpand(){
  document.addEventListener('input', function (event) {
  if (event.target.tagName.toLowerCase() !== 'textarea') return;
  autoExpand(event.target);
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
  var storageChange = changes['counts'];
  if (storageChange === undefined) return;
  if (storageChange.newValue === undefined) {
      app.clearAll();
      return
  };
    app.loadAll(function(){})
  });
}

function initScrollDetection() {
  //initates the scrollspy for the filing-nav module.
  var spy = new Gumshoe('#filing-nav a',{
      nested: true,
      nestedClass: 'active-parent',
      offset: 200, // how far from the top of the page to activate a content area
      reflow: true, // if true, listen for reflows
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


function countyNameFromCountyCode(countyCode) {
    counties = {
        "Ancr": "Addison",
        "Bncr": "Bennington",
        "Cacr": "Caledonia",
        "Cncr": "Chittenden",
        "Excr": "Essex",
        "Frcr": "Franklin",
        "Gicr": "Grand Isle",
        "Lecr": "Lamoille",
        "Oecr": "Orange",
        "Oscr": "Orleans",
        "Rdcr": "Rutland",
        "Wncr": "Washington",
        "Wmcr": "Windham",
        "Wrcr": "Windsor"
    }
    return counties[countyCode]
}
function countyCodeFromCounty(county) {
    countyCodes = {
        "Addison": "Ancr",
        "Bennington": "Bncr",
        "Caledonia" : "Cacr",
        "Chittenden" : "Cncr",
        "Essex": "Excr",
        "Franklin": "Frcr",
        "Grand Isle" : "Gicr",
        "Lamoille" : "Lecr",
        "Orange" : "Oecr",
        "Orleans" : "Oscr",
        "Rutland" : "Rdcr",
        "Washington": "Wncr",
        "Windham" : "Wmcr",
        "Windsor" : "Wrcr"
    }
    return countyCodes[county]
}



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
          }
          if (result.settings !== undefined && result.settings !== "") {
            console.log("settings found")
            console.log(JSON.stringify(result.settings))
            Vue.set(app, "settings", result.settings)
          } else {
            console.log("No settings found, saving default settings")
            app.saveSettings()
          }
          if (result.responses !== undefined) {
              app.responses = result.responses
          }

          callback();
          app.$nextTick(function () {
            app.updatePageTitle();
            //call any vanilla js functions that need to run after vue is all done setting up.
            initAfterVue();
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
        return {num:count.docketNum, county:count.docketCounty, string: count.docketNum + " " + countyCodeFromCounty(count.county)}
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
      this.saved.counts.push({ description: 'New', filingType:"" })
    },
    confirmDeleteCount: function(event, countId) {
      event.stopPropagation();
        if (this.saved.counts.length > 1) {
          var currentCount = this.saved.counts.filter(count => count.uid === countId)[0]
          if (confirm(`Are you sure that you would like to delete the count \"${currentCount.description}\"?`))
          {
            this.deleteCount(countId)
          }
          return;
        }
        if (confirm("Are you sure that you would like to delete the last count, this will clear all petitioner information."))
        {
          this.clearAll()
        }
    },
    deleteCount: function(countId){
        index = this.saved.counts.findIndex(x => x.uid === countId);
        Vue.delete(app.saved.counts, index);
    },
    updatePageTitle: function(){
      return
    },
    clearAll: function(){

        chrome.storage.local.remove(['counts','responses'], function(){
      document.location.reload()

      })

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
    addAndOpenManagePage: function(){
      if (this.saved.counts.length == 0){
        this.newCount()
        Vue.set(app.saved,"defName","New Petitioner")

      }
      this.openManagePage()
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
  confirmClearData: function () {

    if (confirm("Are you sure you want to clear all data for this petitioner?"))
    {
      this.clearAll()
    }
  },
  resetSettings: function(element) {
    if (confirm("Are you sure you want to reset setting to the defaults?"))
    {
        chrome.storage.local.remove(['settings'])
    }
  },

  printDocument: function(){
    // This array will hold all the values that the user has not filled out.
    let notFilledArray = []
    let phoneValue = this.responses['phone'];
    let filingsValue = this.responses['filing'];
    let attorney = this.settings['attorney'];
    let attorneyAddress = this.settings['attorneyAddress'];
    let attorneyPhone = this.settings['attorneyPhone']
    console.log(this.responses)
    //Checking to see which values have not been filled out.
    if (phoneValue.length == 0 || phoneValue == null) {
      notFilledArray.push('Petitioner Phone Number')
    }
    if (filingsValue.length == 0 || filingsValue == null) {
      notFilledArray.push('Filings')
    }
    //Checks when Pro Se Box is NOT checked
    if (this.settings.proSe == false){
      if (attorney.length == 0 || attorney == null){
        notFilledArray.push('Attorney Name')
      }
      if (attorneyAddress.length == 0 || attorneyAddress == null){
        notFilledArray.push('Attorney Address')
      }
      if (attorneyPhone.length == 0 || attorneyPhone == null){
        notFilledArray.push('Attorney Phone')
      }
    }
    //This line ensures that each string in the array is printed
    //to a seperate line in the confirm box.
    notFilledArraySeperateLines = notFilledArray.join("\n")
    if (notFilledArray.length > 0){
      result = confirm("There are " + notFilledArray.length + " blank field(s): \n" + notFilledArraySeperateLines.toString());
    }else {
      result = true
    }
    if (result){
      window.print();
    }
  },
  exportContent:function(){
    downloadCSV({ data_array: app.csvData, filename: app.csvFilename })
  }
},
  computed: {
  	petitioner: function () {
      return {
  		name: this.saved.defName,
  		dob: this.saved.defDOB,
  		address: this.nl2br(this.saved.defAddress)
  	  }
    },
    filings: function (){
      var shouldGroupCounts = true;
      if (this.settings.groupCounts !== undefined) {
        shouldGroupCounts = this.settings.groupCounts;
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
    countsExpungedNC: function () {
      return this.saved.counts.filter(count => count.filingType === "ExNC" || count.filingType === "StipExNC");
    },
    countsExpungedC: function () {
      return this.saved.counts.filter(count => count.filingType === "ExC" || count.filingType === "StipExC");
    },
    countsExpungedNCrim: function () {
      return this.saved.counts.filter(count => count.filingType === "ExNCrim" || count.filingType === "StipExNCrim");
    },
    countsSealC: function () {
      return this.saved.counts.filter(count => count.filingType === "SC" || count.filingType === "StipSC");
    },
    countsSealDui: function () {
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
          Petitioner_Filing: app.responses.filing,
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


    },
    toCountyCode: function(value){
        if (!value) return ''
        return countyCodeFromCounty(value)

    }


  }
});
