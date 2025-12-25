<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { Device, ApiResponse } from '../types/device';

const route = useRoute();
const router = useRouter();
const baseUrl = import.meta.env.VITE_API_BASE_URL;

const deviceId = route.params.device_id as string;
const device = ref<Device | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
let refreshTimer: number | null = null;

// 响应式列数
const isMobile = ref(window.innerWidth <= 768);
const descriptionColumns = computed(() => isMobile.value ? 1 : 2);

// 监听窗口大小变化
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const fetchDeviceDetail = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`${baseUrl}/v1/devices/${deviceId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Device> = await response.json();

    if (result.code === 0) {
      device.value = result.data;
      // Sort records by index in ascending order
      if (device.value.records) {
        device.value.records.sort((a, b) => b.index - a.index);
      }
    } else {
      throw new Error(result.msg || '获取设备详情失败');
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取设备详情失败';
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
    case 'UPLOADING':
      return '上传中';
    default:
      return status;
  }
};

const viewRecord = (recordId: string) => {
  router.push(`/devices/${deviceId}/records/${recordId}`);
};

const startAutoRefresh = () => {
  // Refresh every 5 seconds
  refreshTimer = window.setInterval(() => {
    fetchDeviceDetail();
  }, 5000);
};

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

onMounted(() => {
  fetchDeviceDetail();
  startAutoRefresh();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  stopAutoRefresh();
  window.removeEventListener('resize', handleResize);
});
</script>

<template>
  <div class="device-detail">
    <div class="page-header">
      <span class="page-title">设备详情</span>
    </div>

    <div class="content" v-loading="loading">
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />

      <template v-else-if="device">
        <!-- 基本信息 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>

          <el-descriptions :column="descriptionColumns" border>
            <el-descriptions-item label="设备名称">
              {{ device.name }}
            </el-descriptions-item>
            <el-descriptions-item label="设备ID">
              {{ device.id }}
            </el-descriptions-item>
            <el-descriptions-item label="WiFi MAC">
              {{ device.wifi_mac }}
            </el-descriptions-item>
            <el-descriptions-item label="芯片ID">
              {{ device.chip_id }}
            </el-descriptions-item>
            <el-descriptions-item label="制造商">
              {{ device.manufacturer }}
            </el-descriptions-item>
            <el-descriptions-item label="型号">
              {{ device.model }}
            </el-descriptions-item>
            <el-descriptions-item label="固件版本">
              {{ device.firmware_version }}
            </el-descriptions-item>
            <el-descriptions-item label="IDF版本">
              {{ device.idf_version }}
            </el-descriptions-item>
            <el-descriptions-item label="Flash大小">
              {{ formatBytes(device.flash_size) }}
            </el-descriptions-item>
            <el-descriptions-item label="RAM大小">
              {{ formatBytes(device.ram_size) }}
            </el-descriptions-item>
            <el-descriptions-item label="重启原因">
              {{ device.reset_reason }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="descriptionColumns">
              {{ device.description }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDateTime(device.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ formatDateTime(device.updated_at) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 录音记录 -->
        <el-card class="records-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>录音记录 ({{ device.records.length }})</span>
            </div>
          </template>

          <div class="table-container">
            <el-table
              :data="device.records"
              stripe
              :style="{ width: isMobile ? 'auto' : '100%' }"
              :empty-text="'暂无录音记录'"
            >
              <el-table-column prop="index" label="序号" :width="isMobile ? 60 : 80" />
              <el-table-column prop="begin_time" label="开始时间" :width="isMobile ? 140 : 180">
                <template #default="{ row }">
                  {{ isMobile ? formatDateTime(row.begin_time).split(' ')[1] : formatDateTime(row.begin_time) }}
                </template>
              </el-table-column>
              <el-table-column prop="duration_seconds" label="时长" :width="isMobile ? 70 : 100">
                <template #default="{ row }">
                  {{ formatDuration(row.duration_seconds) }}
                </template>
              </el-table-column>
              <el-table-column prop="size_bytes" label="大小" :width="isMobile ? 80 : 120">
                <template #default="{ row }">
                  {{ formatBytes(row.size_bytes) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" :width="isMobile ? 70 : 100">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="speakers" label="说话人" width="120" class-name="mobile-hidden">
                <template #default="{ row }">
                  <span v-if="row.speakers && row.speakers.length > 0">
                    {{ row.speakers.join(', ') }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="150" class-name="mobile-hidden">
                <template #default="{ row }">
                  <span v-if="row.remark">{{ row.remark }}</span>
                  <span v-else class="text-muted">-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" :width="isMobile ? 70 : 100" :fixed="!isMobile ? 'right' : false">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    size="small"
                    @click="viewRecord(row.index)"
                  >
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </template>
    </div>
  </div>
</template>

<style lang="css" scoped>
.device-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.content {
  margin-top: 20px;
}

.info-card,
.records-card {
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

.table-container {
  width: 100%;
  overflow-x: auto;
}

:deep(.el-descriptions__label) {
  width: 120px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .device-detail {
    padding: 10px;
  }

  .page-title {
    font-size: 18px;
  }

  .card-header {
    font-size: 14px;
  }

  /* 设置描述列表在移动端为单列 */
  :deep(.el-descriptions) {
    --el-descriptions-item-bordered-label-width: 80px;
  }

  :deep(.el-descriptions__label) {
    width: 80px !important;
    font-size: 13px;
  }

  :deep(.el-descriptions__content) {
    font-size: 13px;
    word-break: break-word;
  }

  /* 表格在移动端优化 */
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 4px;
  }

  :deep(.el-button--small) {
    padding: 4px 8px;
    font-size: 12px;
  }

  /* 隐藏说话人和备注列在移动端 */
  :deep(.mobile-hidden) {
    display: none !important;
  }

  /* 移动端取消固定列，避免空白 */
  :deep(.el-table__fixed),
  :deep(.el-table__fixed-right) {
    display: none !important;
  }

}

/* 小屏幕设备（如手机竖屏） */
@media (max-width: 480px) {
  .device-detail {
    padding: 8px;
  }

  .content {
    margin-top: 10px;
  }

  .info-card,
  .records-card {
    margin-bottom: 15px;
  }

  :deep(.el-card__body) {
    padding: 10px;
  }

  /* 更紧凑的表格 */
  :deep(.el-table) {
    font-size: 11px;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 6px 2px;
  }

  :deep(.el-button--small) {
    padding: 3px 6px;
    font-size: 11px;
  }
}
</style>
