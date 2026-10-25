/**
 * Major routes for the Graduate Tracer module.
 *
 * @remarks
 * Mounted in `server.ts` under `/api/graduateTracer/major`. The methods and
 * paths are the same as in the original JavaScript router. Add, remove, edit
 * and "related majors" all use `POST`, as before, so existing clients keep
 * working.
 *
 * | Method | Path                | Handler           | Access |
 * | ------ | ------------------- | ----------------- | ------ |
 * | `POST` | `/add/:programId`   | `addMajor`        | admin  |
 * | `POST` | `/remove/:majorId`  | `removeMajor`     | admin  |
 * | `POST` | `/edit/:majorId`    | `editMajor`       | admin  |
 * | `GET`  | `/list`             | `listMajor`       | public |
 * | `POST` | `/:programId`       | `getRelatedMajor` | public |
 *
 * **Access**
 *
 * The write routes need an admin token (`requireAdmin`). The two read routes
 * stay public because the survey form uses them to fill its dropdowns.
 *
 * **Route order**
 *
 * `POST /:programId` matches any path with a single segment. It stays last so
 * it can never hide a more specific route. Do not move it above the others.
 *
 * @packageDocumentation
 */

import { Router } from "express";
import majorController from "../controllers/majorController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const majorRouter = Router();

// Add a major to a program.
majorRouter.post("/add/:programId", requireAdmin, majorController.addMajor);

// Delete a major.
majorRouter.post("/remove/:majorId", requireAdmin, majorController.removeMajor);

// Rename a major.
majorRouter.post("/edit/:majorId", requireAdmin, majorController.editMajor);

// List all majors.
majorRouter.get("/list", majorController.listMajor);

// List the majors that belong to a program. Keep this route last.
majorRouter.post("/:programId", majorController.getRelatedMajor);

export default majorRouter;