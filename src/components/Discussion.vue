<template>
  <div class="discussion">
    <el-card>
      <p class="discussion"><b>{{ username }}</b> <span class="upvotes">{{ postedDate }}</span> </p>
      <div v-html="comment"></div>
      <span class="upvotes">upvoted {{ upvotes }} times</span>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Discussion',
  props: {
    comment: String,
    postedDate: String,
    upvotes: Number,
    username: String,
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
p.discussion {
  margin: 5px 0px;
}
span.upvotes {
  font-size: small;
}
</style>
