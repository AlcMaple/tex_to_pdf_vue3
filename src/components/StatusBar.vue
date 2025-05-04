<template>
  <div
    class="status-bar"
    :class="{ success: status === 'success', error: status === 'error' }"
  >
    <span class="message">{{ message }}</span>
    <span v-if="status === 'success'" class="actions">
      <el-button type="primary" size="small" @click="$emit('download')"
        >下载PDF</el-button
      >
    </span>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  status: {
    type: String,
    default: "idle", // 'idle', 'loading', 'success', 'error'
  },
  message: {
    type: String,
    default: "就绪",
  },
});

defineEmits(["download"]);
</script>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  height: 40px;
  background-color: #f5f7fa;
  border-top: 1px solid #dcdfe6;
}

.success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.error {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>