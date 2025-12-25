<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { Record, ApiResponse } from '../types/device';

const route = useRoute();
const router = useRouter();
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const deviceId = route.params.device_id as string;
const recordId = route.params.record_id as string;
const record = ref<Record | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// 响应式列数
const isMobile = ref(window.innerWidth <= 768);
const descriptionColumns = computed(() => isMobile.value ? 1 : 2);

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const fetchRecordDetail = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`${baseUrl}/v1/devices/${deviceId}/records/${recordId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Record> = await response.json();

    if (result.code === 0) {
      record.value = result.data;
      // Sort keypoints by timestamp if available
      if (record.value.keypoints) {
        record.value.keypoints.sort((a, b) => a.timestamp - b.timestamp);
      }
    } else {
      throw new Error(result.msg || '获取记录详情失败');
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取记录详情失败';
    ElMessage.error(error.value);
  } finally {
    loading.value = false;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTimestamp = (timestamp: number): string => {
  const hrs = Math.floor(timestamp / 3600);
  const mins = Math.floor((timestamp % 3600) / 60);
  const secs = Math.floor(timestamp % 60);
  const ms = Math.floor((timestamp % 1) * 1000);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const getStatusType = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PROCESSING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'info';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '已完成';
    case 'PROCESSING':
      return '处理中';
    case 'FAILED':
      return '失败';
    default:
      return status;
  }
};

const audioUrl = computed(() => {
  return record.value?.url || '';
});

const hasKeypoints = computed(() => {
  return record.value?.keypoints && record.value.keypoints.length > 0;
});

onMounted(() => {
  fetchRecordDetail();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="record-detail">
    <el-page-header @back="router.back()" title="返回">
      <template #content>
        <span class="page-title">录音详情</span>
      </template>
    </el-page-header>

    <div class="content" v-loading="loading">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />

      <template v-else-if="record">
        <!-- 录音信息 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>录音信息</span>
              <el-tag :type="getStatusType(record.status)">
                {{ getStatusText(record.status) }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="descriptionColumns" border>
            <el-descriptions-item label="录音序号">
              {{ record.index }}
            </el-descriptions-item>
            <el-descriptions-item label="录音ID">
              {{ record.id }}
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">
              {{ formatDateTime(record.begin_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="时长">
              {{ formatDuration(record.duration_seconds) }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatBytes(record.size_bytes) }}
            </el-descriptions-item>
            <el-descriptions-item label="CRC16">
              {{ record.crc16 }}
            </el-descriptions-item>
            <el-descriptions-item label="说话人" :span="descriptionColumns">
              <span v-if="record.speakers && record.speakers.length > 0">
                {{ record.speakers.join(', ') }}
              </span>
              <span v-else class="text-muted">未识别</span>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="descriptionColumns">
              <span v-if="record.remark">{{ record.remark }}</span>
              <span v-else class="text-muted">无</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 音频播放器 -->
        <el-card class="player-card" shadow="hover" v-if="audioUrl">
          <template #header>
            <div class="card-header">
              <span>音频播放</span>
              <el-button
                type="primary"
                size="small"
                :href="audioUrl"
                target="_blank"
                link
              >
                下载音频
              </el-button>
            </div>
          </template>

          <div class="audio-player-container">
            <audio controls :src="audioUrl" class="audio-player">
              您的浏览器不支持音频播放。
            </audio>
          </div>
        </el-card>

        <!-- 转写内容 -->
        <el-card class="content-card" shadow="hover" v-if="record.content">
          <template #header>
            <div class="card-header">
              <span>转写内容</span>
            </div>
          </template>

          <div class="transcription-content">
            {{ record.content }}
          </div>
        </el-card>

        <!-- 关键点 -->
        <el-card class="keypoints-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>关键点 ({{ record.keypoints?.length || 0 }})</span>
            </div>
          </template>

          <div v-if="hasKeypoints">
            <el-timeline>
              <el-timeline-item
                v-for="keypoint in record.keypoints"
                :key="keypoint.id"
                :timestamp="formatTimestamp(keypoint.timestamp)"
                placement="top"
              >
                <el-card shadow="hover">
                  <div class="keypoint-content">
                    <p class="keypoint-text">{{ keypoint.content }}</p>
                    <div class="keypoint-meta" v-if="keypoint.speaker">
                      <el-tag size="small" type="info">{{ keypoint.speaker }}</el-tag>
                    </div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="暂无关键点" />
        </el-card>
      </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.record-detail {
  padding: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.content {
  margin-top: 20px;
}

.info-card,
.player-card,
.content-card,
.keypoints-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.text-muted {
  color: #909399;
}

.audio-player-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.audio-player {
  width: 100%;
  max-width: 600px;
}

.transcription-content {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.keypoint-content {
  padding: 10px 0;
}

.keypoint-text {
  margin: 0 0 10px 0;
  line-height: 1.6;
  font-size: 14px;
}

.keypoint-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

:deep(.el-descriptions__label) {
  width: 120px;
}

:deep(.el-timeline-item__timestamp) {
  font-weight: 600;
  color: #409eff;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .record-detail {
    padding: 10px;
  }

  .page-title {
    font-size: 16px;
  }

  .content {
    margin-top: 15px;
  }

  .card-header {
    font-size: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .info-card,
  .player-card,
  .content-card,
  .keypoints-card {
    margin-bottom: 15px;
  }

  /* 描述列表优化 */
  :deep(.el-descriptions) {
    --el-descriptions-item-bordered-label-width: 80px;
  }

  :deep(.el-descriptions__label) {
    width: 80px !important;
    font-size: 13px;
  }

  :deep(.el-descriptions__content) {
    font-size: 13px;
  }

  /* 音频播放器 */
  .audio-player-container {
    padding: 10px 0;
  }

  /* 转写内容 */
  .transcription-content {
    padding: 12px;
    font-size: 14px;
    line-height: 1.6;
  }

  /* 关键点卡片 */
  .keypoint-text {
    font-size: 13px;
  }

  :deep(.el-timeline) {
    padding-left: 10px;
  }

  :deep(.el-timeline-item__wrapper) {
    padding-left: 20px;
  }

  :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
  }

  :deep(.el-card__body) {
    padding: 12px;
  }

  /* 按钮优化 */
  :deep(.el-button--small) {
    padding: 5px 10px;
    font-size: 12px;
  }
}

/* 小屏幕设备（如手机竖屏） */
@media (max-width: 480px) {
  .record-detail {
    padding: 8px;
  }

  .content {
    margin-top: 10px;
  }

  .info-card,
  .player-card,
  .content-card,
  .keypoints-card {
    margin-bottom: 12px;
  }

  .transcription-content {
    padding: 10px;
    font-size: 13px;
  }

  .keypoint-text {
    font-size: 12px;
  }

  :deep(.el-page-header__content) {
    font-size: 14px;
  }
}
</style>
