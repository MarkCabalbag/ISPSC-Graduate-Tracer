/* eslint-disable react-hooks/rules-of-hooks -- see "HOOKS NOTE" in the header */
/**
 * =============================================================================
 * AppModal.tsx — ONE modal for the whole admin side
 * =============================================================================
 *
 * PURPOSE
 * -------
 * A single modal component. What changes between modals is only DATA, kept in
 * the MODALS table below: the title, the content, the API hook, and the
 * confirm behavior. There is no per-modal component and no per-modal file.
 *
 * THIS FILE REPLACES (delete these files)
 * ---------------------------------------
 *   CreateDepartment, CreateProgram, CreateMajor,
 *   DeleteDepartment, DeleteProgram, DeleteMajor,
 *   EditProgram, EditMajor, DeleteStudentInfo, UpdateStudentInfo,
 *   TotalGraduates.
 *
 * USAGE (in any page)
 * -------------------
 *   const [modal, setModal] = useState<ModalState>(null);
 *
 *   <button onClick={() => setModal({ type: "deleteMajor", id: major.id })} />
 *
 *   <AppModal modal={modal} onClose={() => setModal(null)} />   // once per page
 *
 * MODAL STATE: { type, id?, title? }   (title is optional; it overrides the default)
 * --------------------------
 *   type                id means
 *   ------------------  ------------------------------------------
 *   createDepartment    (none)
 *   deleteDepartment    department id
 *   createProgram       department id   (the program is created under it)
 *   editProgram         program id
 *   deleteProgram       program id
 *   createMajor         program id      (the major is created under it)
 *   editMajor           major id
 *   deleteMajor         major id
 *   deleteStudent       student record id
 *   updateStudent       student record id (not used yet — see TODO)
 *   addTotalGraduates   id of the first totalGraduates record
 *                       (totalGraduates?.[0]?.id ?? 0). Also pass `title`
 *                       (the old `titleModal` prop) to set the dialog title.
 *
 * HOW TO ADD OR CHANGE A MODAL
 * ----------------------------
 *   Add one entry to MODALS. Fields:
 *     title          Dialog title.
 *     kind           "form"    -> one text input (create / edit)
 *                    "confirm" -> a warning message (delete)
 *                    "custom"  -> your own JSX in `content`
 *     label          (form)    Label above the input.
 *     placeholder    (form)    Input placeholder.
 *     message        (confirm) Warning text.
 *     content        (custom)  JSX to render.
 *     confirmLabel   Confirm button text.
 *     pendingLabel   Text next to the spinner while the request runs.
 *     destructive    Red confirm button.
 *     clearOnError   (form) Clear the input after a failed submit.
 *     uppercase      (form) Show the input in uppercase (default: true).
 *     contentClassName  Extra classes for the dialog box (e.g. width).
 *     useAction      The API + state for this modal. Returns:
 *                      { value, setValue, submit, isPending, isError }
 *                    Use toAction(mutation, { value, set }) to build it.
 *
 * FLOW (same for every modal)
 * ---------------------------
 *   Confirm -> await action.submit()
 *     success -> clear the input (if any) and close
 *     failure -> log "[AppModal] <type> failed:", stay open
 *                (form with clearOnError: input is cleared)
 *   Cancel / Esc / click outside -> clear the input (if any) and close
 *
 * HOOKS NOTE
 * ----------
 *   `useAction` calls React hooks and is chosen by `modal.type`. This is safe
 *   because AppModal mounts the body with a `key` built from type + id, so a
 *   different modal always gets a fresh component (the hook order never
 *   changes inside one mounted component). That is why the eslint
 *   "rules-of-hooks" rule is disabled for this file.
 *
 * BEHAVIOR vs. THE OLD MODALS
 * ---------------------------
 *   Same: texts, titles, hooks, store fields, uppercase input display
 *   (except addTotalGraduates, which keeps the typed case),
 *   failure handling (create clears input, edit keeps it, delete stays open).
 *   Changed (on purpose):
 *     1. One dialog at a time (fixes "modal mounted per program/major").
 *     2. The target id travels with the modal state (no shared `selectedId`,
 *        no `openEditProgram` store flag).
 *     3. DeleteProgram waits for the request and closes only on success.
 *     4. All delete buttons are red; every form shows the red error border.
 *     5. Closing a form clears the input (also fixes EditProgram leaving old
 *        text in the shared store field `program`).
 *     6. Linked label, no <p> nesting, proper titles, no render-time logs.
 *
 * TODO — updateStudent (kept as it was, NOT finished)
 * ---------------------------------------------------
 *   - "Update" only closes the dialog (no API call; the student's data is not
 *     loaded into the form).
 *   - GraduateEmploymentInformation already renders the relevance, sector and
 *     location sections, so they appear TWICE (duplicate ids).
 *   - GraduateEmploymentInformation has its own Submit that creates a NEW
 *     response and reloads the page.
 *   Give me the update hook and I will wire it in the same table.
 *
 * NOTE — addTotalGraduates
 * ------------------------
 *   The typed text is converted with Number(total) and is not validated: an
 *   empty or non-numeric value becomes 0 / NaN and is sent as is (same as the
 *   old TotalGraduates modal). Its failure path clears the input silently
 *   (nothing is logged except by AppModal's "[AppModal] ... failed:").
 *
 * DEBUGGING GUIDE
 * ---------------
 *   - Nothing opens        -> the page must set `modal` and render <AppModal />.
 *   - Wrong item affected  -> log `modal`; its `id` is passed to the hook.
 *   - Submit fails         -> console: "[AppModal] <type> failed:".
 *   - Quick trace (temporary): console.debug("[AppModal]", modal);
 *
 * DEPENDENCIES
 * ------------
 *   react, lucide-react, ../ui/{alert-dialog,button,input,label},
 *   ../form/* (updateStudent only), ../../context/{hooks,store}
 * =============================================================================
 */

import { ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import GeneralInformation from "../form/GeneralInformation";
import GraduateEmploymentInformation from "../form/GraduateEmploymentInformation";
import RelevanceOfEmployment from "../form/RelevanceOfEmployment";
import EmployementSector from "../form/EmployementSector";
import LocationOfEmployment from "../form/LocationOfEmployment";
import {
  useAddTotalGraduates,
  useCreateCollege,
  useCreateMajor,
  useCreateProgram,
  useDeleteStudentRecord,
  useEditMajor,
  useEditProgram,
  useRemoveDepartment,
  useRemoveMajor,
  useRemoveProgram,
} from "../../context/hooks";
import { useAdminStore } from "../../context/store";

/* -----------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------------*/

type ModalKind =
  | "createDepartment"
  | "deleteDepartment"
  | "createProgram"
  | "editProgram"
  | "deleteProgram"
  | "createMajor"
  | "editMajor"
  | "deleteMajor"
  | "deleteStudent"
  | "updateStudent"
  | "addTotalGraduates"


export type ModalState = {
  type: ModalKind;
  id?: number;
  /** Optional dialog title; overrides the default title of the modal type. */
  title?: string;
} | null;

/** What every modal's API/state hook must return. */
type Action = {
  value: string;
  setValue: (value: string) => void;
  submit: () => Promise<unknown>;
  isPending: boolean;
  isError: boolean;
};

type ModalConfig = {
  title: string;
  kind: "form" | "confirm" | "custom";
  label?: string;
  placeholder?: string;
  message?: string;
  content?: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  clearOnError?: boolean;
  uppercase?: boolean;
  contentClassName?: string;
  useAction: (modal: NonNullable<ModalState>) => Action;
};

/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/

type Mutation = {
  mutateAsync: () => Promise<unknown>;
  isPending: boolean;
  isError: boolean;
};

/** Turns a mutation (+ optional text field) into the uniform Action shape. */
const toAction = (
  mutation: Mutation,
  text?: { value: string; set: (value: string) => void }
): Action => ({
  value: text?.value ?? "",
  setValue: text?.set ?? (() => {}),
  submit: mutation.mutateAsync,
  isPending: mutation.isPending,
  isError: mutation.isError,
});

/** Delete modals are identical except for title, message and hook. */
const deleteModal = (
  title: string,
  message: string,
  useRemove: (id: number) => Mutation,
  confirmLabel = "Confirm"
): ModalConfig => ({
  title,
  kind: "confirm",
  message,
  confirmLabel,
  pendingLabel: "Deleting...",
  destructive: true,
  useAction: (modal) => toAction(useRemove(modal.id as number)),
});

/* -----------------------------------------------------------------------------
 * MODALS table — the ONLY place that differs between modals
 * ---------------------------------------------------------------------------*/

const MODALS: Record<ModalKind, ModalConfig> = {
  /* ----- Department -------------------------------------------------------- */
  createDepartment: {
    title: "Create College / Department",
    kind: "form",
    label:
      "Please fill in the details below to create a new college or department.",
    placeholder: "Please enter college / department name",
    confirmLabel: "Create",
    pendingLabel: "Creating...",
    clearOnError: true,
    useAction: () => {
      const { department, setCollegeDepartment } = useAdminStore();
      return toAction(useCreateCollege(department), {
        value: department,
        set: setCollegeDepartment,
      });
    },
  },
  deleteDepartment: deleteModal(
    "Delete Department",
    "Are you sure you want to delete this department? This action cannot be undone. Please confirm that you want to delete this department.",
    useRemoveDepartment
  ),

  /* ----- Program ----------------------------------------------------------- */
  createProgram: {
    title: "Create Program",
    kind: "form",
    label: "Program Name",
    placeholder: "Please enter the program name",
    confirmLabel: "Continue",
    pendingLabel: "Creating...",
    clearOnError: true,
    useAction: (modal) => {
      const { program, setProgramDepartment } = useAdminStore();
      return toAction(useCreateProgram(program, modal.id as number), {
        value: program,
        set: setProgramDepartment,
      });
    },
  },
  editProgram: {
    title: "Edit Program",
    kind: "form",
    label: "New Program Name",
    confirmLabel: "Confirm",
    pendingLabel: "Saving...",
    clearOnError: false,
    useAction: (modal) => {
      const { program, setNewProgram } = useAdminStore();
      return toAction(useEditProgram(modal.id as number, program), {
        value: program,
        set: setNewProgram,
      });
    },
  },
  deleteProgram: deleteModal(
    "Delete Program",
    "Are you willing to remove this program? This action cannot be undone. Please confirm that you want to delete this program. Removing this program will also delete all the data related to this program.",
    useRemoveProgram
  ),

  /* ----- Major ------------------------------------------------------------- */
  createMajor: {
    title: "Create Major",
    kind: "form",
    label: "Major Name",
    confirmLabel: "Create",
    pendingLabel: "Creating...",
    clearOnError: true,
    useAction: (modal) => {
      const { major, setMajorProgram } = useAdminStore();
      return toAction(useCreateMajor(major, modal.id as number), {
        value: major,
        set: setMajorProgram,
      });
    },
  },
  editMajor: {
    title: "Edit Major",
    kind: "form",
    label: "New Major Name",
    confirmLabel: "Confirm",
    pendingLabel: "Saving...",
    clearOnError: false,
    useAction: (modal) => {
      const [major, setMajor] = useState(""); // local state, as in the old EditMajor
      return toAction(useEditMajor(modal.id as number, major), {
        value: major,
        set: setMajor,
      });
    },
  },
  deleteMajor: deleteModal(
    "Remove Major",
    "Are you willing to remove this major? This action cannot be undone. Please confirm that you want to delete this major.",
    useRemoveMajor
  ),

  /* ----- Student ----------------------------------------------------------- */
  deleteStudent: deleteModal(
    "Remove Student",
    "Are you sure you want to delete this student information? This action cannot be undone.",
    useDeleteStudentRecord,
    "Delete"
  ),
  /* ----- Total graduates --------------------------------------------------- */
  addTotalGraduates: {
    title: "Add Total Graduates", // pass `title` in the modal state to override
    kind: "form",
    label: "Please fill the exact number of graduates",
    placeholder: "Please enter total of graduates",
    confirmLabel: "Add",
    pendingLabel: "", // spinner only, as in the old modal
    clearOnError: true,
    uppercase: false,
    useAction: (modal) => {
      const [total, setTotal] = useState(""); // local state, as in the old modal
      return toAction(
        useAddTotalGraduates(modal.id as number, Number(total)),
        { value: total, set: setTotal }
      );
    },
  },

  updateStudent: {
    // TODO: unfinished — see "TODO — updateStudent" in the header.
    title: "Update Student",
    kind: "custom",
    content: (
      <>
        <GeneralInformation />
        <GraduateEmploymentInformation />
        <RelevanceOfEmployment />
        <EmployementSector />
        <LocationOfEmployment />
      </>
    ),
    confirmLabel: "Update",
    pendingLabel: "Updating...",
    contentClassName: "max-w-11/12 sm:max-w-2xl",
    useAction: () => ({
      value: "",
      setValue: () => {},
      submit: async () => {}, // no API yet: Update just closes
      isPending: false,
      isError: false,
    }),
  },

};

/* -----------------------------------------------------------------------------
 * The single modal component
 * ---------------------------------------------------------------------------*/

type AppModalProps = {
  modal: ModalState;
  onClose: () => void;
};

const ModalBody = ({
  modal,
  onClose,
}: {
  modal: NonNullable<ModalState>;
  onClose: () => void;
}) => {
  const config = MODALS[modal.type];
  const action = config.useAction(modal);

  /** Clears the input (no-op for modals without one) and closes. */
  const handleClose = () => {
    action.setValue("");
    onClose();
  };

  /** Runs the API call; closes on success, stays open on failure. */
  const handleSubmit = async () => {
    try {
      await action.submit();
      handleClose();
    } catch (error) {
      console.error(`[AppModal] ${modal.type} failed:`, error);
      if (config.clearOnError) action.setValue("");
    }
  };

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <AlertDialogContent className={config.contentClassName}>
        {/* Title + content */}
        <AlertDialogHeader>
          <AlertDialogTitle>{modal.title ?? config.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {config.kind === "form" && (
                <>
                  <Label htmlFor="modal-name-input" className="my-3">
                    {config.label}
                  </Label>
                  <Input
                    id="modal-name-input"
                    className={action.isError ? "border-red-500" : ""}
                    type="text"
                    placeholder={config.placeholder}
                    value={
                      config.uppercase === false
                        ? action.value
                        : action.value.toUpperCase()
                    }
                    onChange={(e) => action.setValue(e.target.value)}
                  />
                </>
              )}
              {config.kind === "confirm" && (
                <Label className="text-gray-600 leading-6">
                  {config.message}
                </Label>
              )}
              {config.kind === "custom" && config.content}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Actions: Cancel / Confirm */}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={action.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            disabled={action.isPending}
            className={
              config.destructive ? "bg-red-600 hover:bg-red-700 text-white" : ""
            }
            onClick={handleSubmit}
          >
            {action.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                {config.pendingLabel}
              </div>
            ) : (
              config.confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const AppModal = ({ modal, onClose }: AppModalProps) => {
  if (!modal) return null;
  // `key` remounts the body when the modal changes, keeping hook order stable.
  return (
    <ModalBody
      key={`${modal.type}:${modal.id ?? ""}`}
      modal={modal}
      onClose={onClose}
    />
  );
};

export default AppModal;