

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



var app = new Vue({
  el: '#filing-app',
  data: {
    message: 'Hello Vue!',
    saved: {
    	defName: "",
    	defAddress: "",
    	defDOB: "",
    	counts: "",
    },
    response: ""
  },
  mounted() {
  	console.log('App mounted!');
  	chrome.storage.local.get('expungevt', function (result) {
        var data = result.expungevt[0]
        app.saved = data
        console.log(data);
    });
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
      var isMultipleCounts = numCounts > 0
      function countString(num) {
  			if (num > 0) {
  				return num+" Counts"
  			} else {
  				return "1 Count"
  			}
  		}
      return {
  		docketNum: "1",
  		title: "Petition To Expunge Conviction",
  		courtCounty: "placeholder-county",
  		numCounts: numCounts,
  		isMultipleCounts: isMultipleCounts,
  		numCountsString: countString(numCounts)
  	  }
    }
  }
  
  
})