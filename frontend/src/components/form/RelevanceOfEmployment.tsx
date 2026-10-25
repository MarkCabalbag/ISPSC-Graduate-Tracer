/**
 * =============================================================================
 * RelevanceOfEmployment.tsx — Survey form section III: Relevance of Employment
 * =============================================================================
 *
 * PURPOSE
 * -------
 * One section of the Graduate Tracer survey form. It asks three Yes/No
 * questions and saves each answer to the global form store:
 *   1. Is your job aligned with your program?
 *   2. Are you self-employed
 *   3. Are your currently enrolled in further studies?
 *
 * PROPS
 * -----
 *   None.
 *
 * STATE / DATA FLOW
 * -----------------
 *   useFormStore() handlers (each receives "yes" or "no"):
 *     handleAlignedJob(value)      -> stored as `isJobAligned`
 *     handleSelfEmployed(value)    -> stored as `isSelfEmployed`
 *     handleFurtherStudies(value)  -> stored as `isFurtherStudies`
 *   These store values are submitted by GraduateEmploymentInformation.
 *   Each RadioGroup is UNCONTROLLED: it keeps its own selection internally and
 *   only reports changes to the store (it does not read the saved value back).
 *
 * UI STRUCTURE
 * ------------
 *   Section banner ("III. Relevance of Employment Degree")
 *   Question 1 + RadioGroup (Yes / No)  -> handleAlignedJob
 *   Question 2 + RadioGroup (Yes / No)  -> handleSelfEmployed
 *   Question 3 + RadioGroup (Yes / No)  -> handleFurtherStudies
 *
 * USAGE
 * -----
 *   <RelevanceOfEmployment />   // rendered inside GraduateEmploymentInformation
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - An answer isn't saved       -> check the matching handler in
 *                                    ../../context/store (see STATE / DATA FLOW).
 *   - Clicking "Yes"/"No" labels
 *     changes the WRONG question  -> this is KNOWN ISSUE 1 below (duplicate ids).
 *   - Wrong value stored          -> values are exactly "yes" or "no".
 *   - Quick trace (temporary), e.g. for question 1:
 *       onValueChange={(value) => {
 *         console.debug("[RelevanceOfEmployment] aligned:", value);
 *         handleAlignedJob(value);
 *       }}
 *
 * KNOWN ISSUES (documented, intentionally NOT changed — behavior preserved)
 * -------------------------------------------------------------------------
 *   1. DUPLICATE IDS: all three groups use the ids "yes" and "no", and the
 *      "Are you currently employed?" group in GraduateEmploymentInformation
 *      uses them too. Ids must be unique in a page. Because each <Label
 *      htmlFor="yes"> targets the FIRST element with that id in the DOM,
 *      clicking the label text of Yes/No in questions 2 and 3 (and in this
 *      section's Q1) can select an option in a different group. Clicking the
 *      radio circle itself works correctly.
 *      Suggested fix: give every item a unique id (e.g. "aligned-yes",
 *      "selfEmployed-yes", "furtherStudies-yes") and match each htmlFor.
 *   2. The three radio groups are uncontrolled and have no default selection,
 *      so saved answers are not pre-selected if the component is remounted.
 *   3. Question wording is kept as-is: question 2 has no question mark and
 *      question 3 reads "Are your currently enrolled..." (likely "Are you").
 *   4. The section banner uses `my-8` while sibling sections use `mb-8`
 *      (e.g. EmployementSector), so vertical spacing differs slightly.
 *
 * DEPENDENCIES
 * ------------
 *   ../ui/radio-group, ../ui/label, ../../context/store
 * =============================================================================
 */

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useFormStore } from "../../context/store";

const RelevanceOfEmployment = () => {
  /* ----- Store ------------------------------------------------------------ */
  const { handleAlignedJob, handleSelfEmployed, handleFurtherStudies } =
    useFormStore();

  /* ----- Render ----------------------------------------------------------- */
  return (
    <div className="my-5">
      {/* Section banner */}
      <h1 className="bg-primary p-3 main-font rounded-md my-8">
        III. Relevance of Employment Degree
      </h1>

      {/* ===== Question 1: Job aligned with program -> handleAlignedJob ===== */}
      <div>
        <h1 className="text-md font-bold text-gray-700 mb-3">
          Is your job aligned with your program?
        </h1>
        <RadioGroup onValueChange={(value) => handleAlignedJob(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No</Label>
          </div>
        </RadioGroup>
      </div>

      {/* ===== Question 2: Self-employed -> handleSelfEmployed ============== */}
      <div>
        <h1 className="text-md font-bold text-gray-700 mb-3">
          Are you self-employed
        </h1>
        <RadioGroup onValueChange={(value) => handleSelfEmployed(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No</Label>
          </div>
        </RadioGroup>
      </div>

      {/* ===== Question 3: Further studies -> handleFurtherStudies ========= */}
      <div>
        <h1 className="text-md font-bold text-gray-700 mb-3">
          Are your currently enrolled in further studies?
        </h1>
        <RadioGroup onValueChange={(value) => handleFurtherStudies(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default RelevanceOfEmployment;