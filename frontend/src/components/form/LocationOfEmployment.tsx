/**
 * =============================================================================
 * LocationOfEmployment.tsx — Survey form section V: Location of Employment
 * =============================================================================
 *
 * PURPOSE
 * -------
 * One section of the Graduate Tracer survey form. It asks the respondent:
 * "Where is your current job located?" and saves the answer to the global
 * form store.
 *
 * PROPS
 * -----
 *   None.
 *
 * STATE / DATA FLOW
 * -----------------
 *   useFormStore().handleCurrentJobLocation(value)
 *     Called every time the selected radio option changes. `value` is one of:
 *       "locally"
 *       "abroad"
 *   The RadioGroup is UNCONTROLLED: it keeps its own selection internally and
 *   only reports changes to the store (it does not read the saved value back).
 *   The store value is submitted as `currentJobLocated` by
 *   GraduateEmploymentInformation.
 *
 * UI STRUCTURE
 * ------------
 *   Section banner ("V. Location of Employment")
 *   Question label
 *   RadioGroup
 *     - Locally
 *     - Abroad
 *
 * USAGE
 * -----
 *   <LocationOfEmployment />   // rendered inside GraduateEmploymentInformation
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Selection not saved       -> check `handleCurrentJobLocation` in
 *                                  ../../context/store (useFormStore).
 *   - Wrong value stored        -> compare the stored value with the two
 *                                  option values above (exact strings).
 *   - Clicking a label does
 *     nothing                   -> each Label's `htmlFor` must equal its
 *                                  RadioGroupItem `id`.
 *   - Quick trace (temporary):
 *       onValueChange={(value) => {
 *         console.debug("[LocationOfEmployment]", value);
 *         handleCurrentJobLocation(value);
 *       }}
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. The group is uncontrolled and has no default selection, so a previously
 *      saved answer is not pre-selected if the component is remounted.
 *   2. Radio ids ("locally", "abroad") are generic; if another radio group on
 *      the same page uses the same ids, label clicks may target the wrong input.
 *   3. The section banner uses `my-8` while sibling sections use `mb-8`
 *      (e.g. EmployementSector), so the vertical spacing differs slightly.
 *
 * DEPENDENCIES
 * ------------
 *   ../ui/radio-group, ../ui/label, ../../context/store
 * =============================================================================
 */

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useFormStore } from "../../context/store";

const LocationOfEmployment = () => {
  /* ----- Store ------------------------------------------------------------ */
  const { handleCurrentJobLocation } = useFormStore();

  /* ----- Render ----------------------------------------------------------- */
  return (
    <div className="my-5">
      {/* Section banner */}
      <h1 className="bg-primary p-3 main-font rounded-md my-8">
        V. Location of Employment
      </h1>

      <div>
        {/* Question */}
        <h1 className="text-md font-bold text-gray-700 mb-3">
          Where is your current job located?
        </h1>

        {/* Options: selection is reported to the store on change */}
        <RadioGroup onValueChange={(value) => handleCurrentJobLocation(value)}>
          {/* Option: Locally */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="locally" id="locally" />
            <Label htmlFor="locally">Locally</Label>
          </div>

          {/* Option: Abroad */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="abroad" id="abroad" />
            <Label htmlFor="abroad">Abroad</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default LocationOfEmployment;