<script>
export default {
  props: ["name", "dob"],
};
</script>

<template>
  <div class="docket-caption">
    <div class="docket-caption__names">
      <p class="docket-caption__party"><span class="docket-caption-label">In RE:</span> {{ name }}</p>
    </div>
    <div class="docket-caption__names">
      <p class="docket-caption__party">DOB {{ dob }}</p>
    </div>
  </div>
</template>
