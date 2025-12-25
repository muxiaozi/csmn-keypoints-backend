export interface Keypoint {
  id: string;
  record_id: string;
  timestamp: number;
  content: string;
  speaker: string | null;
  created_at: string;
}

export interface Record {
  id: string;
  index: number;
  device_id: string;
  begin_time: string;
  duration_seconds: number;
  size_bytes: number;
  crc16: number;
  remark: string | null;
  url: string;
  path?: string;
  content: string | null;
  speakers: string[];
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  keypoints?: Keypoint[];
}

export interface Device {
  id: string;
  name: string;
  wifi_mac: string;
  flash_size: number;
  ram_size: number;
  chip_id: string;
  reset_reason: string;
  idf_version: string;
  firmware_version: string;
  manufacturer: string;
  model: string;
  description: string;
  created_at: string;
  updated_at: string;
  records: Record[];
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}
