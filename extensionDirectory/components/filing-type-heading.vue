<script>
export default {
  methods: {
    getCheckoutPhrases(fType) {
      checkoutPhrases = [
        {
          type: "ExC",
          stipType: "StipExC",
          phrase:
            "The following are prior conviction(s) for which we prepared a petition to expunge:",
        },
        {
          type: "ExNC",
          stipType: "StipExNC",
          phrase:
            "The following are cases that DID NOT result in a conviction and we prepared a petition to expunge:",
        },
        {
          type: "ExNCrim",
          stipType: "StipExNCrim",
          phrase:
            "The following are counts that are no longer crimes and we prepared a petition to expunge:",
        },
        {
          type: "SC",
          stipType: "StipSC",
          phrase:
            "The following are prior convictions and we prepared a petition to seal:",
        },
        {
          type: "SDui",
          stipType: "StipSDui",
          phrase:
            "The following is a prior DUI conviction and we filed a petition to seal:",
        },
      ];

      for (i = 0; i < checkoutPhrases.length; i++) {
        if (
          checkoutPhrases[i]["type"] == fType ||
          checkoutPhrases[i]["stipType"] == fType
        ) {
          return checkoutPhrases[i]["phrase"];
        }
      }
    },
  },
  props: ["heading"],
};
</script>

<template>
  <div>
      <p>
        {{getCheckoutPhrases(heading)}}
      </p>
  </div>
</template>
