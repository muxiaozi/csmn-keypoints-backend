<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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
});

onUnmounted(() => {
  stopAutoRefresh();
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

          <el-descriptions :column="2" border>
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
            <el-descriptions-item label="描述" :span="2">
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

          <el-table
            :data="device.records"
            stripe
            style="width: 100%"
            :empty-text="'暂无录音记录'"
          >
            <el-table-column prop="index" label="序号" width="80" />
            <el-table-column prop="begin_time" label="开始时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.begin_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="duration_seconds" label="时长" width="100">
              <template #default="{ row }">
                {{ formatDuration(row.duration_seconds) }}
              </template>
            </el-table-column>
            <el-table-column prop="size_bytes" label="大小" width="120">
              <template #default="{ row }">
                {{ formatBytes(row.size_bytes) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="speakers" label="说话人" width="120">
              <template #default="{ row }">
                <span v-if="row.speakers && row.speakers.length > 0">
                  {{ row.speakers.join(', ') }}
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150">
              <template #default="{ row }">
                <span v-if="row.remark">{{ row.remark }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="viewRecord(row.index)"
                >
                  查看详情
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  :href="row.url"
                  target="_blank"
                  link
                >
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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

:deep(.el-descriptions__label) {
  width: 120px;
}
</style>
