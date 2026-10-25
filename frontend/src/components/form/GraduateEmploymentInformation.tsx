/**
 * =============================================================================
 * GraduateEmploymentInformation.tsx — Survey form section II (+ submit)
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Main body of the Graduate Tracer survey form. It lets the respondent pick
 * their College/Department -> Program -> Major (cascading dropdowns), say
 * whether they are employed, fill in the related employment sub-sections, and
 * then Clear or Submit the whole survey.
 *
 * PROPS
 * -----
 *   None. All form values live in the global form store (useFormStore).
 *
 * PAGE LAYOUT (top to bottom)
 * ---------------------------
 *   Section banner ("II. Graduate Employment Information")
 *   1. College / Department select   (loads on mount)
 *   2. Program select                (loads after a department is chosen)
 *   3. Major select                  (loads after a program is chosen)
 *   4. "Are you currently employed?" radio (Yes / No)
 *      - <RelevanceOfEmployment />
 *      - <EmployementSector />
 *      - <LocationOfEmployment />
 *   5. Buttons: Clear, Submit
 *
 * CASCADING DROPDOWN FLOW
 * -----------------------
 *   Department chosen -> handleDepartmentChange(value, getDepartment)
 *                        -> store updates departmentId, fetches programs,
 *                           opens the Program select (isProgramOpen)
 *   Program chosen    -> handleMajorChange(value, getMajor)
 *                        -> store updates programId, fetches majors,
 *                           opens the Major select (isMajorOpen)
 *   Major chosen      -> handleMajorSelect(value)  -> store updates majorId
 *   Employed chosen   -> handleEmployedChange(value)  ("yes" | "no")
 *   Hidden selects use the CSS class "hidden" (they stay mounted).
 *
 * DATA SOURCES (hooks from ../../context/hooks)
 * ---------------------------------------------
 *   hooks.useGetCollegeDepartment()    -> departments list + isLoading
 *   hooks.useGetRelatedProgram(id)     -> mutateAsync (getDepartment), programs, isPending
 *   hooks.useGetRelatedMajor(id)       -> mutateAsync (getMajor), majors, isPending
 *   hooks.useAddResponse()             -> mutateAsync (addResponse), isPending, isError
 *
 * SUBMIT PAYLOAD (sent by addResponse)
 * ------------------------------------
 *   yearOfSurvey (number), email, fullName, yearOfGraduation (number),
 *   departmentId, programId, majorId, isJobAligned, isSelfEmployed,
 *   isFurtherStudies, typeOfOrganization, currentJobLocated, isEmployed
 *   All values come from useFormStore.
 *
 * AFTER SUBMIT / CLEAR
 * --------------------
 *   resetForm() resets department, major, major-select and employed values in
 *   the store, then reloads the page after RELOAD_DELAY_MS (2 seconds) to wipe
 *   the uncontrolled inputs. Submit only does this if addResponse succeeds.
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Departments never load        -> check hooks.useGetCollegeDepartment
 *                                      (isDepartmentLoading / data).
 *   - Program/Major select missing  -> they are hidden until isProgramOpen /
 *                                      isMajorOpen are true in the store.
 *   - Program/Major list empty      -> check the fetch triggered inside
 *                                      handleDepartmentChange / handleMajorChange.
 *   - "Major is not available"      -> the selected program returned 0 majors.
 *   - Submit does nothing           -> open the console: errors are logged as
 *                                      "An error occured:". Then check the
 *                                      payload values in the store.
 *   - Red border on selects         -> addResponse failed (isError is true).
 *   - Page reloads unexpectedly     -> expected 2s after Clear or a
 *                                      successful Submit (see resetForm).
 *   - Quick trace (temporary), before addResponse in handleSubmit:
 *       console.debug("[GraduateEmploymentInformation] payload", { departmentId, programId, majorId, isEmployed });
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. Errors are only logged to the console; the user sees no error message
 *      (only the red border on the Program/Major selects).
 *   2. `if (majors?.length === 0) {}` in handleSubmit is an empty block and
 *      does nothing; it is kept as-is.
 *   3. The form is reset with window.location.reload() because the selects and
 *      radios are uncontrolled.
 *   4. parseInt(...) is used without a radix and without NaN handling for
 *      yearOfSurvey / yearOfGraduation.
 *   5. Radio ids "yes" / "no" are generic; if another radio group on the same
 *      page uses the same ids, label clicks may target the wrong input.
 *   6. Heading styles differ between sections (text-md font-bold vs
 *      text-lg font-medium).
 *   7. There is no required-field validation before Submit.
 *
 * DEPENDENCIES
 * ------------
 *   lucide-react, ../ui/{label,radio-group,select,button},
 *   ./RelevanceOfEmployment, ./EmployementSector, ./LocationOfEmployment,
 *   ../../context/{hooks,store}, ../../types/type
 * =============================================================================
 */

import { hooks } from "../../context/hooks";
import { EmploymentInformation } from "../../types/type";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { Loader2Icon } from "lucide-react";
import { Button } from "../ui/button";
import RelevanceOfEmployment from "./RelevanceOfEmployment";
import EmployementSector from "./EmployementSector";
import LocationOfEmployment from "./LocationOfEmployment";
import { useFormStore } from "../../context/store";

/* -----------------------------------------------------------------------------
 * Constants
 * ---------------------------------------------------------------------------*/

/** Delay before the page reloads after Clear / successful Submit. */
const RELOAD_DELAY_MS = 2000;

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

const GraduateEmploymentInformation = () => {
  /* ----- Data: department list ------------------------------------------- */
  const { data: department, isLoading: isDepartmentLoading } =
    hooks.useGetCollegeDepartment();

  /* ----- Store: form values + handlers ------------------------------------ */
  const {
    isProgramOpen,
    isMajorOpen,
    yearOfSurvey,
    isEmployed,
    email,
    fullName,
    yearOfGraduation,
    departmentId,
    programId,
    majorId,
    isJobAligned,
    isSelfEmployed,
    isFurtherStudies,
    typeOfOrganization,
    currentJobLocated,
    handleMajorSelect,
    handleDepartmentChange,
    handleMajorChange,
    handleEmployedChange,
  } = useFormStore();

  /* ----- Data: programs (depends on departmentId) ------------------------- */
  const {
    mutateAsync: getDepartment,
    data: programs,
    isPending: isProgramPending,
  } = hooks.useGetRelatedProgram(departmentId || 0);

  /* ----- Data: majors (depends on programId) ------------------------------ */
  const {
    mutateAsync: getMajor,
    data: majors,
    isPending: isMajorPending,
  } = hooks.useGetRelatedMajor(programId as number);

  /* ----- Data: submit response -------------------------------------------- */
  const {
    mutateAsync: addResponse,
    isPending: isAddResponsePending,
    isError,
  } = hooks.useAddResponse();

  /* ----- Handlers --------------------------------------------------------- */

  /** Resets the store values, then reloads the page to clear uncontrolled inputs. */
  const resetForm = () => {
    handleDepartmentChange("", getDepartment);
    handleMajorChange("", getMajor);
    handleMajorSelect("");
    handleEmployedChange("");
    setTimeout(() => {
      window.location.reload();
    }, RELOAD_DELAY_MS);
  };

  /** Sends the survey to the API; resets the form only on success. */
  const handleSubmit = async () => {
    try {
      if (majors?.length === 0) {
      }
      await addResponse({
        yearOfSurvey: parseInt(yearOfSurvey),
        email: email,
        fullName: fullName,
        yearOfGraduation: parseInt(yearOfGraduation),
        departmentId: departmentId,
        programId: programId,
        majorId: majorId,
        isJobAligned: isJobAligned,
        isSelfEmployed: isSelfEmployed,
        isFurtherStudies: isFurtherStudies,
        typeOfOrganization: typeOfOrganization,
        currentJobLocated: currentJobLocated,
        isEmployed: isEmployed,
      });

      resetForm();
    } catch (e) {
      console.log("An error occured:", e);
    }
  };

  /* ----- Render ----------------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto ">
      <h1 className="bg-primary p-4 main-font rounded-lg mb-8">
        II. Graduate Employment Information
      </h1>

      <div className="space-y-8">
        {/* ===== 1. Department Section ==================================== */}
        {isDepartmentLoading ? (
          <div className="flex gap-2 items-center text-primary p-4 bg-primary/5 rounded-lg">
            <Loader2Icon className="animate-spin" />
            <span>Loading departments...</span>
          </div>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-md font-bold text-gray-700 mb-3">
                College / Department
              </h2>
              <Select
                onValueChange={(value) =>
                  handleDepartmentChange(value, getDepartment)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select College / Department" />
                </SelectTrigger>
                <SelectContent>
                  {department?.map((emInfo: EmploymentInformation) => (
                    <SelectItem key={emInfo.id} value={String(emInfo.id)}>
                      {emInfo.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* ===== 2. Program Section ======================================== */}
        {isProgramPending ? (
          <div className="flex gap-2 items-center text-primary p-4 bg-primary/5 rounded-lg">
            <Loader2Icon className="animate-spin" />
            <span>Loading programs...</span>
          </div>
        ) : (
          <div
            className={`bg-white p-6 rounded-lg shadow-sm ${
              isProgramOpen ? "" : "hidden"
            }`}
          >
            <h2 className="text-lg font-medium mb-3">Program</h2>
            <Select
              onValueChange={(value) => handleMajorChange(value, getMajor)}
            >
              <SelectTrigger
                className={`w-full ${isError ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                {programs?.map((program: EmploymentInformation) => (
                  <SelectItem key={program.id} value={String(program.id)}>
                    {program.program}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ===== 3. Major Section ========================================== */}
        <>
          {majors?.length === 0 && (
            <div className="p-4 bg-primary/5 rounded-lg text-gray-600">
              Major is not available
            </div>
          )}

          {isMajorPending ? (
            <div className="flex gap-2 items-center text-primary p-4 bg-primary/5 rounded-lg">
              <Loader2Icon className="animate-spin" />
              <span>Loading majors...</span>
            </div>
          ) : (
            <div
              className={`bg-white p-6 rounded-lg shadow-sm ${
                isMajorOpen ? "" : "hidden"
              }`}
            >
              <h2 className="text-lg font-medium mb-3">Major</h2>
              <Select onValueChange={(value) => handleMajorSelect(value)}>
                <SelectTrigger
                  className={`w-full ${isError ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Select Major" />
                </SelectTrigger>
                <SelectContent>
                  {majors?.map((major: EmploymentInformation) => (
                    <SelectItem key={major.id} value={String(major.id)}>
                      {major.major}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>

        {/* ===== 4. Employment Status Section ============================== */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-md font-bold text-gray-700 mb-3">
            Are you currently employed?
          </h2>
          <RadioGroup
            onValueChange={(value) => handleEmployedChange(value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no">No</Label>
            </div>
          </RadioGroup>

          {/* Related employment sub-sections */}
          <div className="space-y-6 mt-6">
            <RelevanceOfEmployment />
            <EmployementSector />
            <LocationOfEmployment />
          </div>

          {/* ===== 5. Actions: Clear / Submit ============================== */}
          <div className="mt-8 flex justify-end items-center gap-4">
            <Button
              className="bg-white text-primary border border-primary shadow-sm hover:bg-primary/10"
              onClick={resetForm}
            >
              Clear
            </Button>

            {isAddResponsePending ? (
              // Submitting: spinner replaces the Submit button
              <Button className="bg-primary text-white min-w-[100px]">
                <Loader2Icon className="animate-spin" />
              </Button>
            ) : (
              <Button
                className="bg-primary text-white min-w-[100px] hover:bg-primary/90"
                onClick={handleSubmit}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraduateEmploymentInformation;