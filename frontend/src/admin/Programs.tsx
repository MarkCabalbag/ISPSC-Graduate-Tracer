import { useState } from "react";
import { useGetDepartmentDetails } from "../context/hooks";
import AppModal, { type ModalState } from "../components/modal/AppDialog";
import { Button, Card, EmptyState, ErrorState, Skeleton } from "../components/kit";

/** Colleges, their programs and majors: the lists the survey's dropdowns are built from. */
export default function Programs() {
  const { data, isLoading, isError, refetch } = useGetDepartmentDetails();
  const [modal, setModal] = useState<ModalState>(null);
  const departments = data ?? [];

  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pt-6">
        <div>
          <h1 className="text-[28px] leading-9 font-bold tracking-[-0.02em]">Programs and colleges</h1>
          <p className="max-w-[62ch] text-[15px] text-muted-foreground">
            Graduates pick from these lists in the survey. Changes show in the survey right away.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModal({ type: "createDepartment" })}>
          Add a college
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Loading colleges">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <ErrorState title="The colleges could not be loaded." onRetry={() => refetch()} />
        </Card>
      ) : departments.length === 0 ? (
        <Card>
          <EmptyState
            title="Add your first college"
            action={<Button variant="primary" onClick={() => setModal({ type: "createDepartment" })}>Add a college</Button>}
          >
            Add each college, then its programs and majors, so graduates can find their degree in the survey.
          </EmptyState>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {departments.map((department) => (
            <li key={department.id}>
              <Card as="article" aria-labelledby={`dept-${department.id}`} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
                  <div>
                    <h2 id={`dept-${department.id}`} className="text-[17px] font-semibold">
                      {department.department}
                    </h2>
                    <p className="text-[13px] text-faint tabular">
                      {department.listOfProgram.length} {department.listOfProgram.length === 1 ? "program" : "programs"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setModal({ type: "createProgram", id: department.id, name: department.department })}>
                      Add a program
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost-danger"
                      onClick={() => setModal({ type: "deleteDepartment", id: department.id, name: department.department })}
                    >
                      Delete college<span className="sr-only"> {department.department}</span>
                    </Button>
                  </div>
                </div>
                {department.listOfProgram.length === 0 ? (
                  <p className="px-5 py-4 text-muted-foreground sm:px-6">No programs yet. Add the first one.</p>
                ) : (
                  <ul>
                    {department.listOfProgram.map((program) => (
                      <li key={program.id} className="grid gap-2 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(160px,220px)_1fr_auto] sm:items-center sm:px-6">
                        <h3 className="text-[16px] font-semibold">{program.program}</h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {program.listOfMajor.length === 0 ? (
                            <span className="text-[14px] text-faint">No majors</span>
                          ) : (
                            program.listOfMajor.map((major) => (
                              <span key={major.id} className="inline-flex h-8 items-center gap-0.5 rounded-md border border-line bg-band pl-2.5 text-[14px]">
                                {major.major}
                                <button
                                  type="button"
                                  onClick={() => setModal({ type: "editMajor", id: major.id, name: major.major })}
                                  className="grid size-8 place-items-center rounded-md text-faint hover:bg-[#eef0f3] hover:text-ink"
                                  aria-label={`Rename the major ${major.major}`}
                                >
                                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10.5 2.5 13.5 5.5 6 13H3v-3z" strokeLinejoin="round" /></svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setModal({ type: "deleteMajor", id: major.id, name: major.major })}
                                  className="grid size-8 place-items-center rounded-md text-faint hover:bg-danger-50 hover:text-danger"
                                  aria-label={`Delete the major ${major.major}`}
                                >
                                  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" /></svg>
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="flex gap-1 sm:justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setModal({ type: "createMajor", id: program.id, name: program.program })}>
                            Add a major<span className="sr-only"> to {program.program}</span>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setModal({ type: "editProgram", id: program.id, name: program.program })}>
                            Rename<span className="sr-only"> {program.program}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost-danger"
                            onClick={() => setModal({ type: "deleteProgram", id: program.id, name: program.program })}
                          >
                            Delete<span className="sr-only"> {program.program}</span>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <AppModal modal={modal} onClose={() => setModal(null)} />
    </div>
  );
}
