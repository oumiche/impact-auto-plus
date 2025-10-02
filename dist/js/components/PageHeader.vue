<template>
  <div class="page-header">
    <h1 class="section-title">{{ title }}</h1>
    <p class="page-subtitle" v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.section-title {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 1rem;
  border-bottom: 3px solid var(--accent-color);
  padding-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--text-color);
  font-size: 1.1rem;
}
</style>
