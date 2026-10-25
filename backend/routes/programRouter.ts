/**
 * Program routes for the Graduate Tracer module.
 *
 * @remarks
 * Mounted in `server.ts` under `/api/graduateTracer/program`. The methods and
 * paths are the same as in the original JavaScript router. Add, edit and remove
 * use `POST`, as before, so existing clients keep working. The handlers are
 * documented in `programController`.
 *
 * | Method | Path                    | Handler         | Access |
 * | ------ | ----------------------- | --------------- | ------ |
 * | `POST` | `/add/:departmentId`    | `addProgram`    | admin  |
 * | `POST` | `/edit/:programId`      | `editProgram`   | admin  |
 * | `POST` | `/remove/:programId`    | `removeProgram` | admin  |
 * | `GET`  | `/list`                 | `listProgram`   | public |
 *
 * **Access**
 *
 * The write routes need an admin token (`requireAdmin`). The list route stays
 * public because the survey form uses it to fill its dropdown.
 *
 * @packageDocumentation
 */

import { Router } from "express";
import programController from "../controllers/programController.js";
import requireAdmin from "../middleware/requireAdmin.js";

const programRouter = Router();

// Add a program to a department.
programRouter.post(
  "/add/:departmentId",
  requireAdmin,
  programController.addProgram,
);

// Rename a program.
programRouter.post(
  "/edit/:programId",
  requireAdmin,
  programController.editProgram,
);

// Delete a program.
programRouter.post(
  "/remove/:programId",
  requireAdmin,
  programController.removeProgram,
);

// List all programs.
programRouter.get("/list", programController.listProgram);

export default programRouter;