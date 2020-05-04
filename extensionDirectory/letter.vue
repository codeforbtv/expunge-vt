export default {
    name: "childLetter",
    template: `<p>${parentLetterContent["p1"]}</p>`,
    props: {
      parentLetterContent: {
        type: Object,
        required: false,
        default: function (){return {"p1":"did not work"}}
      }
    }
}

    
