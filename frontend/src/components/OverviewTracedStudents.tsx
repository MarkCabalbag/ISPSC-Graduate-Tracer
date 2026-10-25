/**
 * =============================================================================
 * OverviewTracedStudents.tsx: "Traced Graduates" overview of the dashboard
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Shows, for every college / department, how many graduates have been traced,
 * as a grid of cards. When no department exists yet, it lets the admin create
 * the first one.
 *
 * PROPS
 * -----
 *   None. The component loads its own data.
 *
 * DATA
 * ----
 *   useGetOverviewTracedGraduates()  ->  { data, isLoading, isError }
 *     data  OverviewTracedGraduates[]  one entry per department:
 *             id                    unique id (React key)
 *             department            full department name (shown as an acronym)
 *             totalTracedGraduates  number shown on the card
 *
 * RETURNS (one of these states inside the same layout)
 * ----------------------------------------------------
 *   Always:    a header ("Traced Graduates", "Sta. Maria Campus").
 *   Loading:   5 placeholder cards (SKELETON_COUNT).
 *   Error:     a message that the data could not be loaded.
 *   Empty:     "No College / Department found." and a
 *              "Create College / Department" button, which opens the
 *              `createDepartment` modal of <AppModal />.
 *   Success:   one card per department: the traced total (large) and the
 *              department acronym from getAcronym().
 *   The component itself returns nothing to its parent.
 *
 * MODAL
 * -----
 *   Owns one <AppModal /> (renders nothing while closed). Needs <Toaster />
 *   to be mounted by the page (the Dashboard does this) for the toasts of
 *   the modal's API call.
 *
 * REQUIREMENTS
 * ------------
 *   react, lucide-react, ../context/hooks, ../utils/utils (getAcronym),
 *   ./modal/AppDialog, ./ui/{card,button}
 *
 * @example
 * <OverviewTracedStudents />
 * =============================================================================
 */

import { useState } from "react";
import { Frown, GraduationCap, PlusCircleIcon } from "lucide-react";
import { useGetOverviewTracedGraduates } from "../context/hooks";
import type { OverviewTracedGraduates } from "../types/type";
import { getAcronym } from "../utils/utils";
import AppModal, { type ModalState } from "./modal/AppDialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

/** Number of placeholder cards shown while loading. */
const SKELETON_COUNT = 5;

const OverviewTracedStudents = () => {
  const { data, isLoading, isError } = useGetOverviewTracedGraduates();
  const [modal, setModal] = useState<ModalState>(null);

  const isEmpty = !isLoading && !isError && data?.length === 0;
  const hasData = !isLoading && !isError && !!data?.length;

  return (
    <div className="w-[90%] mx-auto my-5">
      <AppModal modal={modal} onClose={() => setModal(null)} />

      <header className="mb-10 border-b pb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" aria-hidden="true" />
          <div>
            <h1 className="font-bold text-primary text-3xl">
              Traced Graduates
            </h1>
            <h2 className="text-gray-600 mt-1">Sta. Maria Campus</h2>
          </div>
        </div>
      </header>

      <div
        aria-busy={isLoading}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      >
        {/* Loading */}
        {isLoading &&
          Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Card
              key={index}
              className="p-6 rounded-xl border-2 bg-primary/50"
            >
              <div className="flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </Card>
          ))}

        {/* Error */}
        {isError && (
          <div
            role="alert"
            className="col-span-full text-center text-gray-500"
          >
            <Frown className="w-8 h-8 mx-auto mb-2" aria-hidden="true" />
            <p>Unable to load the traced graduates. Please try again later.</p>
          </div>
        )}

        {/* Empty */}
        {isEmpty && (
          <div className="col-span-full text-center text-gray-500">
            <Frown className="w-8 h-8 mx-auto mb-2" aria-hidden="true" />
            <p>No College / Department found.</p>
            <Button
              onClick={() => setModal({ type: "createDepartment" })}
              className="bg-primary text-white"
            >
              <PlusCircleIcon />
              Create College / Department
            </Button>
          </div>
        )}

        {/* Success */}
        {hasData &&
          data.map((tracedOverview: OverviewTracedGraduates) => (
            <Card
              key={tracedOverview.id}
              className="p-6 rounded-xl transition-all duration-300 hover:cursor-pointer hover:bg-primary/5 hover:shadow-lg border-2"
            >
              <div className="flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <p className="text-primary text-4xl font-bold">
                    {tracedOverview.totalTracedGraduates}
                  </p>
                  <h2 className="text-primary/90 font-bold text-lg leading-tight">
                    {getAcronym(tracedOverview.department)}
                  </h2>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default OverviewTracedStudents;