/**
 * =============================================================================
 * Dashboard.tsx — Graduate Tracer: Overall Dashboard
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Admin landing page for the Graduate Tracer system. It shows:
 *   1. Header + overview of traced students
 *   2. "Employability Data" table (click a row -> graduates page)
 *   3. Academic structure management:
 *        Department (College)  ->  Program  ->  Major
 *      with Create / Edit / Delete actions at each level.
 *
 * PAGE LAYOUT (top to bottom)
 * ---------------------------
 *   [SECTION 1] Header + OverviewTracedStudents
 *   [SECTION 2] Employability data table (spinner while loading)
 *   [SECTION 3] "Overall Dashboard" banner + Create College / Department
 *   [SECTION 4] Department list -> Program cards -> Majors accordion
 *
 * DATA SOURCES
 * ------------
 *   useGetSummaryData()       -> `data`, `isFetching`   (table in SECTION 2)
 *   useGetDepartmentDetails() -> `departments`          (SECTION 4)
 *   useAdminStore()           -> `openEditProgram`, `setOpenEditProgram`
 *                                (global flag for the Edit Program modal)
 *
 * LOCAL STATE (what controls what)
 * --------------------------------
 *   isOpenCollege            -> CreateDepartment modal
 *   isOpenProgram            -> CreateProgram modal        (uses selectedId = departmentId)
 *   isOpenRemoveDepartment   -> DeleteDepartment modal     (uses selectedId = departmentId)
 *   isOpenMajor              -> CreateMajor modal          (uses selectedId = programId)
 *   isOpenDeleteMajor        -> DeleteMajor modal          (uses selectedId = majorId)
 *   isOpenEditMajor          -> EditMajor modal            (uses selectedId = majorId)
 *   openDeleteProgram        -> DeleteProgram modal        (programId comes from the card it renders in)
 *   selectedId               -> ONE shared id; meaning depends on which button
 *                               was clicked last (department / program / major).
 *
 * NAVIGATION
 * ----------
 *   Table row click -> `/graduates/:yearOfGraduation/:program`
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Table empty / spinner stuck   -> check `useGetSummaryData` (isFetching, data).
 *   - Department list empty         -> check `useGetDepartmentDetails` (defaults to []).
 *   - A modal doesn't open          -> check its `isOpen*` flag and `selectedId`.
 *   - Wrong item edited / deleted   -> check `selectedId` (shared across levels)
 *                                      and see KNOWN ISSUES below.
 *   - Toasts missing                -> `<Toaster />` is mounted once in SECTION 1.
 *   - To trace state quickly, temporarily add inside the component:
 *       console.debug("[Dashboard]", { selectedId, isOpenProgram, isOpenMajor });
 *
 * KNOWN ISSUES (documented, intentionally NOT changed — behavior preserved)
 * -------------------------------------------------------------------------
 *   1. DeleteProgram / EditProgram / CreateMajor are rendered INSIDE each
 *      program card, so when their flag is true a modal is mounted for EVERY
 *      program, not just the clicked one.
 *   2. The program Delete and Edit buttons do not set `selectedId`; the target
 *      program is determined by the card each modal instance is rendered in.
 *   3. DeleteMajor / EditMajor are rendered INSIDE each major row with the
 *      shared `selectedId`, so one open flag mounts a modal per major row.
 *   4. `selectedId` is shared by department, program and major actions.
 *   5. The "Add Major" button uses `hover:bg-red-50` (likely meant to be neutral).
 *   6. `<p>` is nested inside `<h4>` in the program card (invalid HTML nesting).
 *   Recommended future fix: lift each modal out of the `.map()` loops and keep
 *   one modal instance per type, driven by a single `{ type, id }` state.
 *
 * DEPENDENCIES
 * ------------
 *   react, react-router-dom, framer-motion, react-hot-toast, lucide-react,
 *   and local UI components under ../components.
 * =============================================================================
 */

import { columns } from "../components/table/columns";
import { Card } from "../components/ui/card";
import { DataTable } from "../components/table/data-tables";
import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import Header from "../components/Header";
import OverviewTracedStudents from "../components/OverviewTracedStudents";
import { useNavigate } from "react-router-dom";
import { useGetDepartmentDetails, useGetSummaryData } from "../context/hooks";
import { useState } from "react";
import {
  BookCheck,
  Edit2,
  MinusCircleIcon,
  PlusCircleIcon,
  PlusIcon,
  Trash2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { DepartmentDetails, Major, Program } from "../types/type";
import { Button } from "../components/ui/button";
import AppModal, { ModalState } from "../components/modal/AppDialog";

/* -----------------------------------------------------------------------------
 * Animation configuration (static — defined once, outside the component so it
 * is not re-created on every render).
 * ---------------------------------------------------------------------------*/

/** Page-level container: fades in and staggers its direct motion children. */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.5,
    },
  },
};

/** Section-level item: fades in while sliding up 20px. */
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

const Dashboard = () => {
  /* ----- Data ------------------------------------------------------------- */
  const { data, isFetching } = useGetSummaryData();
  const { data: departments = [] } = useGetDepartmentDetails();

  /* ----- Routing ---------------------------------------------------------- */
  const navigate = useNavigate();

  /* ----- Store: modal state ----------------------------------------------- */
  const [openModal, setOpenModal] = useState<ModalState>(null);

  /* ----- Render ----------------------------------------------------------- */
  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <AppModal modal={openModal} onClose={() => setOpenModal(null)} />
      {/* ===== SECTION 1: Header + overview ================================= */}
      <Header />
      <motion.div variants={itemVariants}>
        <OverviewTracedStudents />
      </motion.div>
      {<Toaster />}

      {/* ===== SECTION 2: Employability data table ========================== */}
      <motion.div className="w-[90%] mx-auto" variants={itemVariants}>
        {isFetching ? (
          // Loading state
          <Card className="w-[100%] h-[300px] flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </Card>
        ) : (
          <motion.div
            className="w-[100%]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <DataTable
              dataSheet={data}
              excelFilename="employability-data.xlsx"
              serachFor="Year of Graduation"
              filterInputName={"yearOfGraduation"}
              tableHeader={
                <div>
                  <h1 className="text-primary font-bold">Employability Data</h1>
                  <p className="text-sm">Overall Data</p>
                </div>
              }
              columns={columns}
              data={data}
              onRowClick={(row: any) =>
                navigate(`/graduates/${row?.yearOfGraduation}/${row?.program}`)
              }
            />
          </motion.div>
        )}
      </motion.div>

      {/* ===== SECTION 3: Dashboard banner + Create College / Department ==== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-[90%] mx-auto my-5 bg-primary rounded-md p-3 sm:p-5"
      >

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-white font-bold text-xl sm:text-2xl">
              Overall Dashboard
            </h1>
            <h2 className="text-white text-sm sm:text-base">Graduate Tracer</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="w-full sm:w-auto"
          >
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setOpenModal({ type: "createDepartment" })}
                className="w-full sm:w-auto bg-white text-primary hover:bg-primary/10 hover:text-white transition-colors duration-300 text-xs sm:text-sm"
              >
                <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="ml-1">Create College / Department</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ===== SECTION 4: Departments -> Programs -> Majors ================= */}
      <main className="w-[90%] mx-auto my-5">
        <div>
          <div className="grid gap-8">
            {departments.map((department: DepartmentDetails) => (
              /* ---------- Department card ---------- */
              <motion.div
                key={department.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
              >
                {/* Department header: name + actions */}
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                  <div>
                    <p className="text-gray-500 font-bold text-sm sm:text-base">
                      Department
                    </p>
                    <h3 className="text-sm sm:text-base">
                      {department.department}
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        setOpenModal({ type: "createProgram", id: department?.id as number });
                      }}
                      className="bg-primary text-white w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="ml-1">Create Program</span>
                    </Button>
                    <Button
                      onClick={() => {
                        setOpenModal({ type: "deleteDepartment", id: department?.id as number });
                      }}
                      className="bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-300 w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <MinusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="ml-1">Remove Department</span>
                    </Button>
                  </div>
                </div>

                {/* Programs list */}
                <div className="p-4 sm:p-6 space-y-2">
                  {department.listOfProgram?.map((program: Program) => (
                    /* ---------- Program card ---------- */
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1 }}
                      className="border rounded-xl hover:shadow-md transition-all duration-300"
                    >
                      {/* Program header: name + actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 bg-gray-50/50 gap-4 sm:gap-0">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <BookCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <h4 className="font-semibold text-gray-800 text-sm sm:text-base">
                            <p className="text-gray-500">Program</p>
                            {program.program}
                          </h4>
                        </div>

                        {/* Program actions: Add Major / Delete / Edit */}
                        <div className="flex gap-3 w-full sm:w-auto justify-end">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 transition-colors"
                            onClick={() => {
                              setOpenModal({ type: "createMajor", id: program?.id as number });
                            }}
                            title="Add Major"
                          >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            onClick={() => {
                              setOpenModal({ type: "deleteProgram", id: program?.id as number });
                            }}
                            title="Delete Program"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                            title="Edit Program"
                            onClick={() => setOpenModal({ type: "editProgram", id: program?.id as number })}
                          >
                            <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Majors accordion */}
                      <Accordion type="single" collapsible>
                        <AccordionItem value="majors">
                          <AccordionTrigger className="px-3 sm:px-5 py-3 sm:py-4 hover:no-underline">
                            <span className="text-primary font-medium text-sm sm:text-base">
                              Majors ({program.listOfMajor?.length ?? 0})
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="p-3 sm:p-5 space-y-3 bg-gray-50/30">
                              {program.listOfMajor?.length ? (
                                program.listOfMajor.map((major: Major) => (
                                  /* ---------- Major row ---------- */
                                  <motion.div
                                    key={major.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg hover:shadow-sm transition-all duration-300"
                                  >

                                    <span className="text-gray-700 font-medium text-sm sm:text-base">
                                      {major.major}
                                    </span>

                                    {/* Major actions: Delete / Edit */}
                                    <div className="flex gap-2">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                        title="Delete Major"
                                        onClick={() => {
                                          setOpenModal({ type: "deleteMajor", id: major?.id as number });
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                                        title="Edit Major"
                                        onClick={() => {
                                          setOpenModal({ type: "editMajor", id: major?.id as number });
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                // Empty state
                                <p className="text-gray-500 text-center py-3 text-sm sm:text-base">
                                  No majors available
                                </p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Dashboard;