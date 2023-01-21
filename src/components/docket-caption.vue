<script>
export default {
  props: ["name"],
};
</script>

<template>
  <div class="docket-caption"> 
      <div class="docket-caption__names">
        <p class="">STATE OF VERMONT,</p>
        <p><i>Respondent</i></p>
        <p>v.</p>
        <p class="docket-caption__party">{{name}},</p>
        <p class="docket-caption__label">Petitioner</p>
        </div>
      </div>
</template>

