import { Router, Request, Response } from "express";
import { prisma } from "../../app.js";
import {
  failed,
  forbidden,
  success,
  unauthorized,
} from "../../utils/response.js";
import { asyncHandler } from "../../middlewares/error_handler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.js";
import { deviceSchemas, commonSchemas, schemas } from "../../utils/schemas.js";
import multer from "multer";
import { aiProcessFile } from "../../utils/ai.js";
import logger from "../../utils/logger.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// 获取所有设备
router.get(
  "/",
  validateQuery(schemas.device.queryAllDevice),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    // HACK: 临时使用token验证身份，后续改为JWT
    if (token != process.env.API_ACCESS_TOKEN) {
      return forbidden(res);
    }

    const devices = await prisma.device.findMany({
      include: {
        _count: {
          select: {
            records: true,
          },
        },
      },
    });
    return success(res, devices);
  })
);

// 获取设备
router.get(
  "/:id",
  validateParams(commonSchemas.idParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        records: {
          omit: {
            path: true,
          },
        },
      },
    });
    if (!device) {
      return failed(res, "Device not found", 404);
    }
    return success(res, device);
  })
);

// 获取设备的记录
router.get(
  "/:device_id/records/:record_index",
  validateParams(deviceSchemas.deviceRecordParam),
  asyncHandler(async (req: Request, res: Response) => {
    const { device_id, record_index } = req.params;
    const record = await prisma.record.findUnique({
      where: { device_id_index: { device_id, index: parseInt(record_index) } },
      include: {
        keypoints: true,
      },
    });
    if (!record) {
      return failed(res, "Record not found", 404);
    }
    return success(res, record);
  })
);

// 创建设备
router.post(
  "/",
  validateBody(deviceSchemas.createDevice),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      id,
      name,
      wifi_mac,
      flash_size,
      ram_size,
      chip_id,
      reset_reason,
      idf_version,
      firmware_version,
      manufacturer,
      model,
      description,
    } = req.body;
    const device = await prisma.device.upsert({
      where: { id },
      create: {
        id,
        name,
        wifi_mac,
        flash_size,
        ram_size,
        chip_id,
        reset_reason,
        idf_version,
        firmware_version,
        manufacturer,
        model,
        description,
      },
      update: {
        name,
        wifi_mac,
        flash_size,
        ram_size,
        chip_id,
        reset_reason,
        idf_version,
        firmware_version,
        manufacturer,
        model,
        description,
      },
    });
    return success(res, device);
  })
);

// 上传记录
router.post(
  "/:id/records",
  validateParams(commonSchemas.idParam),
  validateBody(deviceSchemas.createRecord),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { index, begin_time, duration_seconds, size_bytes, crc16 } = req.body;
    const device = await prisma.device.findUnique({
      where: { id },
    });
    if (!device) {
      return failed(res, "Device not found", 404);
    }

    const record = await prisma.record.upsert({
      where: {
        device_id_index: {
          device_id: id,
          index: index,
        },
      },
      update: {
        begin_time: new Date(begin_time),
        duration_seconds,
        size_bytes,
        crc16,
      },
      create: {
        index,
        device_id: id,
        begin_time: new Date(begin_time),
        duration_seconds,
        size_bytes,
        crc16,
      },
    });

    return success(res, record);
  })
);

// 上传记录文件
router.post(
  "/:device_id/records/:record_index/audio",
  validateParams(deviceSchemas.deviceRecordParam),
  upload.single("audio"),
  asyncHandler(async (req: Request, res: Response) => {
    const { device_id, record_index } = req.params;

    const url = `${process.env.BASE_URL}/v1/uploads/${req.file!.filename}`;

    const record = await prisma.record.update({
      where: {
        device_id_index: {
          device_id: device_id,
          index: parseInt(record_index),
        },
      },
      data: {
        url,
        path: `uploads/${req.file!.filename}`,
        status: "PROCESSING",
      },
    });

    if (!record) {
      return failed(res, "Record not found", 404);
    }

    // 让前端先返回，后台异步处理AI任务
    aiProcessFile(url, record.id)
      .then(async (result) => {
        await prisma.record.update({
          where: {
            id: record.id,
          },
          data: {
            content: result.content,
            speakers: result.speakers,
            keypoints: {
              createMany: {
                data: result.keypoints,
              },
            },
            status: "DONE",
          },
        });
      })
      .catch(async (err) => {
        logger.error("AI processing failed for record %s: %o", record.id, err);
        await prisma.record.update({
          where: {
            id: record.id,
          },
          data: {
            status: "PROCESS_FAIL",
          },
        });
      });

    return success(res, record);
  })
);

// 删除设备
// router.post(
//   "/delete",
//   validateBody(commonSchemas.idParam),
//   asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.body;
//     const device = await prisma.device.delete({
//       where: {
//         id,
//       },
//     });
//     return success(res, device);
//   })
// );

export default router;
