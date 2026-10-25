/**
 * Department routes for the Graduate Tracer module.
 *
 * @remarks
 * Mounted in `server.ts` under `/api/graduateTracer/department`. The methods
 * and paths are the same as in the original JavaScript router. Note that edit,
 * remove and "related programs" use `POST`, as before, so existing clients keep
 * working.
 *
 * | Method | Path                      | Handler             | Access |
 * | ------ | ------------------------- | ------------------- | ------ |
 * | `POST` | `/add`                    | `addDepartment`     | admin  |
 * | `POST` | `/edit/:id`               | `editDepartment`    | admin  |
 * | `POST` | `/remove/:id`             | `removeDepartment`  | admin  |
 * | `GET`  | `/list`                   | `departmentList`    | public |
 * | `POST` | `/program/:departmentId`  | `getRelatedProgram` | public |
 *
 * **Access**
 *
 * The write routes need an admin token (`requireAdmin`). The two read routes
 * stay public because the survey form uses them to fill its dropdowns.
 *
 * @packageDocumentation
 */

import { Router } from "express";
import departmentController from "../controllers/departmentController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const departmentRouter = Router();

// Add a department.
departmentRouter.post("/add", requireAdmin, departmentController.addDepartment);

// Rename a department.
departmentRouter.post(
  "/edit/:id",
  requireAdmin,
  departmentController.editDepartment,
);

// Delete a department.
departmentRouter.post(
  "/remove/:id",
  requireAdmin,
  departmentController.removeDepartment,
);

// List all departments.
departmentRouter.get("/list", departmentController.departmentList);

// List the programs that belong to a department.
departmentRouter.post(
  "/program/:departmentId",
  departmentController.getRelatedProgram,
);

export default departmentRouter;