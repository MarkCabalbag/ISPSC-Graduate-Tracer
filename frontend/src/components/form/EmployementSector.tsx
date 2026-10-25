/**
 * =============================================================================
 * EmployementSector.tsx — Survey form section IV: Employment Sector
 * =============================================================================
 *
 * PURPOSE
 * -------
 * One section of the Graduate Tracer survey form. It asks the respondent:
 * "What type of organization do you work for?" and saves the answer to the
 * global form store.
 *
 * PROPS
 * -----
 *   None.
 *
 * STATE / DATA FLOW
 * -----------------
 *   useFormStore().handleTypeOfOrganization(value)
 *     Called every time the selected radio option changes. `value` is one of:
 *       "government"
 *       "private institution"
 *       "entreprenueral / freelance"
 *   The RadioGroup is UNCONTROLLED: it keeps its own selection internally and
 *   only reports changes to the store (it does not read the saved value back).
 *
 * UI STRUCTURE
 * ------------
 *   Section banner ("IV. Employment Sector")
 *   Question label
 *   RadioGroup
 *     - Government
 *     - Private Institution
 *     - Entreprenueral / Freelance
 *
 * USAGE
 * -----
 *   <EmployementSector />   // render inside the survey form flow
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Selection not saved       -> check `handleTypeOfOrganization` in
 *                                  ../../context/store (useFormStore).
 *   - Wrong value stored        -> compare the stored value with the three
 *                                  option values listed above (exact strings).
 *   - Clicking a label does
 *     nothing                   -> each Label's `htmlFor` must equal its
 *                                  RadioGroupItem `id`.
 *   - Quick trace (temporary):
 *       onValueChange={(value) => {
 *         console.debug("[EmployementSector]", value);
 *         handleTypeOfOrganization(value);
 *       }}
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. Spelling ("Employement", "entreprenueral") is kept as-is because the
 *      option values are stored data and may be matched elsewhere (backend,
 *      reports, filters). Changing them could break existing records.
 *   2. Some element `id`s contain spaces and "/" (e.g. "private institution").
 *      This works with `htmlFor`, but simple ids are safer for CSS selectors
 *      and tests.
 *   3. The group is uncontrolled and has no default selection, so a previously
 *      saved answer is not pre-selected if the component is remounted.
 *
 * DEPENDENCIES
 * ------------
 *   ../ui/radio-group, ../ui/label, ../../context/store
 * =============================================================================
 */

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useFormStore } from "../../context/store";

const EmployementSector = () => {
  /* ----- Store ------------------------------------------------------------ */
  const { handleTypeOfOrganization } = useFormStore();

  /* ----- Render ----------------------------------------------------------- */
  return (
    <div className="my-5">
      {/* Section banner */}
      <h1 className="bg-primary p-3 main-font rounded-md mb-8">
        IV. Employment Sector
      </h1>

      <div>
        {/* Question */}
        <h1 className="text-md font-bold text-gray-700 mb-3">
          What type of organization do you work for?
        </h1>

        {/* Options: selection is reported to the store on change */}
        <RadioGroup onValueChange={(value) => handleTypeOfOrganization(value)}>
          {/* Option: Government */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="government" id="government" />
            <Label htmlFor="government">Government</Label>
          </div>

          {/* Option: Private Institution */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="private institution"
              id="private institution"
            />
            <Label htmlFor="private institution">Private Institution</Label>
          </div>

          {/* Option: Entreprenueral / Freelance */}
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="entreprenueral / freelance"
              id="entreprenueral / freelance"
            />
            <Label htmlFor="entreprenueral / freelance">
              Entreprenueral / Freelance
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default EmployementSector;