<script setup lang="ts">
import { onMounted } from 'vue';
import { useTheme } from './composables/useTheme';
import { Moon, Sunny } from '@element-plus/icons-vue';

const { isDark, toggleTheme, initTheme } = useTheme();

onMounted(() => {
  initTheme();
});
</script>

<template>
  <div class="app-container">
    <div class="theme-toggle">
      <el-button
        :icon="isDark ? Sunny : Moon"
        circle
        @click="toggleTheme"
        :title="isDark ? '切换到明亮模式' : '切换到暗黑模式'"
      />
    </div>
    <router-view></router-view>
  </div>
</template>

<style scoped>
.app-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .theme-toggle {
    top: 10px;
    right: 10px;
  }

  .theme-toggle :deep(.el-button) {
    width: 36px;
    height: 36px;
  }
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
