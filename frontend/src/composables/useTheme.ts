import { ref, watch } from 'vue';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'app-theme';

const isDark = ref<boolean>(false);
let isWatcherInitialized = false;

const applyTheme = () => {
  const htmlElement = document.documentElement;
  if (isDark.value) {
    htmlElement.classList.add('dark');
    htmlElement.classList.remove('light');
  } else {
    htmlElement.classList.add('light');
    htmlElement.classList.remove('dark');
  }
};

// 初始化 watcher (只执行一次)
if (!isWatcherInitialized) {
  watch(isDark, (newValue) => {
    const theme: Theme = newValue ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
    applyTheme();
  });
  isWatcherInitialized = true;
}

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  const setTheme = (theme: Theme) => {
    isDark.value = theme === 'dark';
  };

  const initTheme = () => {
    // 从 localStorage 读取保存的主题
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;

    if (savedTheme) {
      isDark.value = savedTheme === 'dark';
    } else {
      // 如果没有保存的主题，检查系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDark.value = prefersDark;
    }

    // 应用主题到 HTML 元素
    applyTheme();
  };

  return {
    isDark,
    toggleTheme,
    setTheme,
    initTheme
  };
}
