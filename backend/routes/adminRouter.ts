/**
 * Admin routes for the Graduate Tracer module.
 *
 * @remarks
 * Mounted in `server.ts` under `/api/graduateTracer/admin`. The methods and
 * paths below are taken from the documentation of `adminController`.
 *
 * | Method   | Path                                                | Handler                   |
 * | -------- | --------------------------------------------------- | ------------------------- |
 * | `GET`    | `/getAllData`                                       | `getSummaryData`          |
 * | `GET`    | `/overviewStudents`                                 | `overviewTracedStudents`  |
 * | `GET`    | `/listOfPrograms`                                   | `listOfPrograms`          |
 * | `GET`    | `/graduates/:yearOfGraduation/:program`             | `OverviewRowGaduates`     |
 * | `GET`    | `/graduates/total/:yearOfGraduation/:program`       | `getTotalGraduates`       |
 * | `POST`   | `/graduates/total/:yearOfGraduation/:program`       | `editTotalGraduates`      |
 * | `GET`    | `/employmentStatistics/:yearOfGraduation/:program`  | `getEmploymentStatistics` |
 * | `GET`    | `/questions/:yearOfGraduation/:program`             | `getQuestions`            |
 * | `GET`    | `/percentage/:yearOfGraduation/:program`            | `tracedPercentage`        |
 * | `GET`    | `/organization/:yearOfGraduation/:program`          | `getTypeOfOrganisation`   |
 * | `GET`    | `/jobLocation/:yearOfGraduation/:program`           | `getCurrentJobLocation`   |
 * | `GET`    | `/department/details`                               | `getDepartmentDetails`    |
 * | `DELETE` | `/student/response/:id`                             | `deleteStudentById`       |
 *
 * **Security note**
 *
 * Every route of this router is admin only. `router.use(requireAdmin)` runs
 * before all of them, so a request without a valid admin token is answered with
 * `401` or `403` and never reaches a handler.
 *
 * @packageDocumentation
 */

import { Router } from "express";
import adminController from "../controllers/adminController.js";
import requireAdmin from "../middleware/requireAdmin.js"

const router = Router();

// Everything below this line needs an admin token.
router.use(requireAdmin);

router.get("/getAllData", adminController.getSummaryData);
router.get("/overviewStudents", adminController.overviewTracedStudents);
router.get("/listOfPrograms", adminController.listOfPrograms);

router.get(
  "/graduates/:yearOfGraduation/:program",
  adminController.OverviewRowGaduates,
);
router.get(
  "/graduates/total/:yearOfGraduation/:program",
  adminController.getTotalGraduates,
);
router.post(
  "/graduates/total/:yearOfGraduation/:program",
  adminController.editTotalGraduates,
);

router.get(
  "/employmentStatistics/:yearOfGraduation/:program",
  adminController.getEmploymentStatistics,
);
router.get(
  "/questions/:yearOfGraduation/:program",
  adminController.getQuestions,
);
router.get(
  "/percentage/:yearOfGraduation/:program",
  adminController.tracedPercentage,
);
router.get(
  "/organization/:yearOfGraduation/:program",
  adminController.getTypeOfOrganisation,
);
router.get(
  "/jobLocation/:yearOfGraduation/:program",
  adminController.getCurrentJobLocation,
);

router.get("/department/details", adminController.getDepartmentDetails);
router.delete("/student/response/:id", adminController.deleteStudentById);

export default router;