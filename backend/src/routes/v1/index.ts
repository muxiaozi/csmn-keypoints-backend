import express, { Router } from "express";
import deviceRoutes from "./device.js";
import tingwuRoutes from "./tingwu.js";

const router = Router();

router.use("/uploads", express.static("uploads"));

router.use("/devices", deviceRoutes);

router.use("/tingwu", tingwuRoutes);

export default router;
