/**
 * =============================================================================
 * GeneralInformation.tsx — Survey form section I: General Information
 * =============================================================================
 *
 * PURPOSE
 * -------
 * First section of the Graduate Tracer survey form. It collects:
 *   1. Full Name
 *   2. Year of Graduation
 * and saves both to the global form store.
 *
 * PROPS
 * -----
 *   None.
 *
 * STATE / DATA FLOW
 * -----------------
 *   Local state
 *     name            Text typed in the Full Name input (controlled input).
 *
 *   Store (useFormStore)
 *     handleNameChange(name)              Called by a useEffect whenever the
 *                                         local `name` changes (and once on mount).
 *     handleGraduationChange(yearString)  Called when a year is selected.
 *                                         The value is a STRING (e.g. "2024").
 *
 *   Year options
 *     Generated once at module load: displayYears(YEAR_START, YEAR_END)
 *     -> 2020 to 2080 (see ../../utils/utils).
 *
 * UI STRUCTURE
 * ------------
 *   Section banner ("I. General Information")
 *   Two-column grid (one column on small screens):
 *     - Full Name         (Input)
 *     - Year of Graduation (Select)
 *
 * USAGE
 * -----
 *   <GeneralInformation />   // render inside the survey form flow
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Name not saved            -> check `handleNameChange` in ../../context/store
 *                                  and that the useEffect below is firing.
 *   - Year not saved            -> check `handleGraduationChange`; remember the
 *                                  value arrives as a string.
 *   - Year list wrong/missing   -> check `displayYears` in ../../utils/utils and
 *                                  YEAR_START / YEAR_END below.
 *   - Dropdown looks unstyled   -> see NOTE 2 (Select import).
 *   - Quick trace (temporary):
 *       useEffect(() => { console.debug("[GeneralInformation] name:", name); }, [name]);
 *
 * NOTES (documented, intentionally NOT changed — behavior preserved)
 * ------------------------------------------------------------------
 *   1. The useEffect runs once on mount with name = "" and calls
 *      handleNameChange(""), which can overwrite a name already in the store.
 *   2. `Select` is imported directly from "@radix-ui/react-select" while its
 *      parts (SelectTrigger, SelectContent, ...) come from "../ui/select".
 *      Other files usually import Select from "../ui/select" as well; this
 *      works today but is inconsistent.
 *   3. The useEffect dependency array is [name] only; `handleNameChange` is not
 *      listed (an eslint react-hooks/exhaustive-deps warning is expected).
 *   4. The year dropdown is uncontrolled (no value bound to the store), so a
 *      saved year is not pre-selected if the component is remounted.
 *   5. The <label> elements are not linked to their inputs (no htmlFor/id).
 *
 * DEPENDENCIES
 * ------------
 *   react, @radix-ui/react-select, ../ui/input, ../ui/select,
 *   ../../utils/utils, ../../context/store
 * =============================================================================
 */

import { Input } from "../ui/input";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { displayYears } from "../../utils/utils";
import { useFormStore } from "../../context/store";
import { useEffect, useState } from "react";

/* -----------------------------------------------------------------------------
 * Constants (computed once at module load)
 * ---------------------------------------------------------------------------*/

const YEAR_START = 2020;
const YEAR_END = 2080;
const years = displayYears(YEAR_START, YEAR_END);

/* -----------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------------*/

const GeneralInformation = () => {
  /* ----- Local state ------------------------------------------------------ */
  const [name, setName] = useState("");

  /* ----- Store ------------------------------------------------------------ */
  const { handleNameChange, handleGraduationChange } = useFormStore();

  /* ----- Effects: sync local name to the store ---------------------------- */
  useEffect(() => {
    handleNameChange(name);
  }, [name]);

  /* ----- Render ----------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Section banner */}
      <h1 className="bg-primary p-4 main-font rounded-lg mb-8">
        I. General Information
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Field: Full Name */}
        <div className="space-y-2">
          <label className="text-md font-bold text-gray-700 mb-3">
            Full Name
          </label>
          <Input
            placeholder="Ex (Juan D. Cruz)"
            type="text"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Field: Year of Graduation */}
        <div className="space-y-2">
          <label className="text-md font-bold text-gray-700 mb-3">
            Year of Graduation
          </label>
          <Select onValueChange={(value) => handleGraduationChange(value)}>
            <SelectTrigger className="w-full focus:ring-2 focus:ring-primary/50 transition-all">
              <SelectValue placeholder="Select Year of Survey" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year: number) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default GeneralInformation;