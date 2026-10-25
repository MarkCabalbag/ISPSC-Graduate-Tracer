/**
 * =============================================================================
 * OverviewRowGraduates.tsx: admin page for ONE year + program
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Shows everything about the graduates of one program in one graduation year:
 * the total number of graduates, the list of surveyed graduates, and the
 * employment charts. It has no props. It is a route page.
 *
 * ROUTE
 * -----
 *   Needs the URL params `:year` and `:program` (react-router `useParams`),
 *   for example ".../:year/:program". If a param is missing, an empty string
 *   is used and the data hooks return nothing.
 *
 * SECTIONS (top to bottom)
 * ------------------------
 *   1. Header + back arrow     Back goes to "/admin".
 *   2. Total graduates bar     Department, program, total, and an
 *                              "Add" (total is 0) or "Edit" button.
 *   3. Graduates table         <DataTable /> with search, sort, paging and
 *                              Excel export ("Graduates.xlsx").
 *   4. Charts                  Shown only when the total is greater than 0.
 *                              When the total is 0, a panel asks the admin to
 *                              add it first.
 *
 * DATA (all from ../context/hooks, all keyed by year + program)
 * -------------------------------------------------------------
 *   useGetGraduatesPerRow       table rows
 *   useGetTotalGraduates        total graduates records
 *   useGetEmploymentStatistics  "Employment Statistics" chart
 *   useGetQuestions             first "Sector-Based Employment" chart
 *   useGetPercentageTraced      "Percentage Traced Graduates" chart
 *   useGetOrganization          second "Sector-Based Employment" chart
 *   useGetCurrentJobLocation    "Location-Based Employment" chart
 *   While loading, skeletons / a spinner are shown. A chart whose data is
 *   missing gets an empty list.
 *
 * MODAL
 * -----
 *   One <AppModal /> for the page. Both the Add and the Edit button open
 *   `addTotalGraduates` with the id of the FIRST total-graduates record
 *   (see AppModal.tsx, section "addTotalGraduates"). The Edit button passes a
 *   different `title`.
 *
 * REQUIREMENTS
 * ------------
 *   - Rendered inside a react-router <Router>.
 *   - <Toaster /> is mounted here for the toasts of the modal's API calls.
 *   - Assets: ../assets/ispsc.png, ../assets/ispsc_campus_hero.jpg
 *
 * @returns The full page as one <div>.
 * =============================================================================
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ArrowLeft, CirclePlus, Edit3 } from "lucide-react";
import ispscLogo from "../assets/ispsc.png";
import campusHero from "../assets/ispsc_campus_hero.jpg";
import Header from "./Header";
import {
  useGetCurrentJobLocation,
  useGetEmploymentStatistics,
  useGetGraduatesPerRow,
  useGetOrganization,
  useGetPercentageTraced,
  useGetQuestions,
  useGetTotalGraduates,
} from "../context/hooks";
import { DataTable } from "./table/data-tables";
import { graduatesRowColumnDef } from "./table/columns";
import GraduatesPerRow from "./table/tableheaders/GraduatesPerRow";
import {
  chartConfigBar,
  chartConfigBarHorizontal,
  chartConfigPie,
  chartConfigQuestions,
  type TotalGraduatesType,
} from "../types/type";
import { ChartBar } from "./charts/ChartBar";
import { ChartPie } from "./charts/ChartPie";
import { ChartMultipleBar } from "./charts/ChartMultipleBar";
import { ChartBarhorizontal } from "./charts/ChartBarHorizontal";
import AppModal, { type ModalState } from "./modal/AppDialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const ADMIN_PATH = "/admin";

const OverviewRowGraduates = () => {
  const { year, program } = useParams();
  // The hooks need strings; a missing URL param becomes "".
  const yearParam = year ?? "";
  const programParam = program ?? "";

  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalState>(null);

  const { data, isLoading, isFetching } = useGetGraduatesPerRow(
    Number(yearParam),
    programParam
  );
  console.log("data", data);
  const { data: totalGraduates, isLoading: isLoadingTotalGraduates } =
    useGetTotalGraduates(yearParam, programParam);
  const { data: employmentStatistics } = useGetEmploymentStatistics(
    yearParam,
    programParam
  );
  const { data: questions } = useGetQuestions(yearParam, programParam);
  const { data: tracedPercentage } = useGetPercentageTraced(
    yearParam,
    programParam
  );
  const { data: organization } = useGetOrganization(yearParam, programParam);
  const { data: jobLocation } = useGetCurrentJobLocation(
    yearParam,
    programParam
  );

  /** Opens the "total graduates" modal for the first total-graduates record. */
  const openTotalGraduatesModal = (title: string) =>
    setModal({
      type: "addTotalGraduates",
      id: totalGraduates?.[0]?.id ?? 0,
      title,
    });

  return (
    <div>
      <AppModal modal={modal} onClose={() => setModal(null)} />
      <Header />
      <h1 className="w-[90%] mx-auto my-5 flex items-center gap-2  font-bold ">
        <button
          type="button"
          aria-label="Back to admin"
          onClick={() => navigate(ADMIN_PATH)}
        >
          <ArrowLeft />
        </button>
        <span className="ml-2 text-gray-500 font-bold text-lg md:text-xl">
          Graduates Overview
        </span>
      </h1>
      <Toaster />

      <div className="w-[95%] md:w-[90%] mx-auto my-3 md:my-5">
        {/* Total graduates bar */}
        {isLoadingTotalGraduates ? (
          <Card className="bg-primary/75 rounded-md mb-3 md:mb-5 p-3 md:p-5">
            <Skeleton className="w-[20%] h-8 md:h-10 bg-primary/50" />
            <Skeleton className="w-[30%] h-8 md:h-10 bg-primary/50" />
          </Card>
        ) : (
          totalGraduates?.map((total: TotalGraduatesType) => {
            const isEmpty = total.totalGraduates === 0;
            return (
              <div
                key={total.id}
                className="my-2 md:my-3 flex flex-col md:flex-row justify-between items-start md:items-center bg-primary p-3 md:p-5 rounded-md space-y-2 md:space-y-0"
              >
                <div>
                  <h1 className="main-font text-sm md:text-base">
                    {total.department}
                  </h1>
                  <h2 className="text-white font-bold text-sm md:text-base">
                    {total.program}
                  </h2>
                </div>
                <div className="w-full md:w-auto">
                  <h1 className="main-font font-bold text-lg md:text-xl text-start md:text-end">
                    {total.totalGraduates}
                  </h1>
                  <p className="italic text-start md:text-end text-white text-sm">
                    Total Graduates
                  </p>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto text-sm"
                    onClick={() =>
                      openTotalGraduatesModal(
                        isEmpty ? "Add Total Graduates" : "Edit Total Graduates"
                      )
                    }
                  >
                    {isEmpty ? (
                      <>
                        <CirclePlus className="w-4 h-4 mr-1" /> Add Total
                        Graduates
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-1" /> Edit Total Graduates
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* Graduates table */}
        {isLoading || isFetching ? (
          <Card className="w-full h-[40vh] md:h-[50vh] bg-primary/10 rounded-md flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-b-2 border-primary"></div>
          </Card>
        ) : (
          <DataTable
            data={data }
            dataSheet={data}
            excelFilename="Graduates.xlsx"
            columns={graduatesRowColumnDef}
            tableHeader={
              <GraduatesPerRow year={yearParam} program={programParam} />
            }
            serachFor="Name"
            filterInputName="fullName"
          />
        )}

        {/* Charts (or the "add total graduates first" panel) */}
        {isLoadingTotalGraduates ? (
          <Card className="bg-primary/75 text-center p-3 md:p-5 rounded-md my-3 md:my-5 h-[20%]">
            <h1 className="main-font text-sm md:text-base">
              Charts are generating...
            </h1>
          </Card>
        ) : (
          <div>
            {totalGraduates?.map((total: TotalGraduatesType) =>
              total.totalGraduates === 0 ? (
                <div
                  key={total.id}
                  className="relative h-[40vh] md:h-[50vh] w-full bg-primary my-3 md:my-5 rounded-md flex flex-col items-center justify-center overflow-hidden"
                >
                  <img
                    src={campusHero}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />

                  <div className="absolute inset-0 bg-black/20"></div>

                  <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
                    <img
                      src={ispscLogo}
                      alt="ISPSC Logo"
                      className="w-12 h-12 md:w-16 md:h-16 object-contain"
                    />

                    <h1 className="main-font text-white text-sm md:text-base">
                      There are no Total Graduates indicated yet
                    </h1>

                    <Button
                      onClick={() =>
                        openTotalGraduatesModal("Add Total Graduates")
                      }
                      className="bg-amber-300 text-primary hover:bg-amber-400 text-sm md:text-base"
                    >
                      Add Total Graduates
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  key={total.id}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 my-3 md:my-5"
                >
                  <div className="col-span-1 md:col-span-2">
                    <ChartBarhorizontal
                      chartData={jobLocation ?? []}
                      chartConfig={chartConfigBarHorizontal}
                      dataKey="location"
                      valueKey="total"
                      title="Location-Based Employment"
                      description="Where do they work?"
                    />
                  </div>
                  <div>
                    <ChartBar
                      chartData={employmentStatistics ?? []}
                      chartConfig={chartConfigBar}
                      dataKey="major"
                      title="Employment Statistics"
                      description="Graduate Outcomes by Major"
                    />
                  </div>
                  <div>
                    <ChartMultipleBar
                      chartConfig={chartConfigQuestions}
                      chartData={questions ?? []}
                      dataKey="question"
                      title="Sector-Based Employment"
                      description="Who works where?"
                    />
                  </div>
                  <div>
                    <ChartPie
                      chartData={tracedPercentage ?? []}
                      chartConfig={chartConfigPie}
                      dataKey="tracedPercentage"
                      nameKey="major"
                      title="Percentage Traced Graduates"
                      description="Traced Graduates by Major"
                    />
                  </div>
                  <div>
                    <ChartBar
                      chartData={organization ?? []}
                      chartConfig={chartConfigBarHorizontal}
                      dataKey="organization"
                      valueKey="total"
                      title="Sector-Based Employment"
                      description="Who works where?"
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewRowGraduates;