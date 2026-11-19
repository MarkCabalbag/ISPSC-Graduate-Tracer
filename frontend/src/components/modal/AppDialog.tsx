/**
 * The add, rename and delete dialogs of the Programs and colleges page, on the native <dialog>
 * element: it traps focus, closes on Escape and returns focus to the button that opened it.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  useCreateCollege,
  useCreateMajor,
  useCreateProgram,
  useEditMajor,
  useEditProgram,
  useRemoveDepartment,
  useRemoveMajor,
  useRemoveProgram,
} from "../../context/hooks";
import { Button, TextField } from "../kit";

type ModalKind =
  | "createDepartment"
  | "deleteDepartment"
  | "createProgram"
  | "editProgram"
  | "deleteProgram"
  | "createMajor"
  | "editMajor"
  | "deleteMajor";

export type ModalState = {
  type: ModalKind;
  /** The record the action works on (the parent's id for a create). */
  id?: number;
  /** The record's current name, shown in the dialog and used to prefill a rename. */
  name?: string;
} | null;

type Copy = { title: (name?: string) => string; body?: (name?: string) => string; label?: string; action: string; danger?: boolean };

const COPY: Record<ModalKind, Copy> = {
  createDepartment: { title: () => "Add a college", label: "College name", action: "Add college" },
  deleteDepartment: {
    title: (n) => `Delete ${n ?? "this college"}?`,
    body: () => "Its programs and majors are deleted with it. Survey answers already given are kept.",
    action: "Delete college",
    danger: true,
  },
  createProgram: { title: (n) => `Add a program${n ? ` to ${n}` : ""}`, label: "Program name, like BSIT", action: "Add program" },
  editProgram: { title: (n) => `Rename ${n ?? "the program"}`, label: "Program name", action: "Save name" },
  deleteProgram: {
    title: (n) => `Delete ${n ?? "this program"}?`,
    body: () => "Its majors are deleted with it. Survey answers already given are kept.",
    action: "Delete program",
    danger: true,
  },
  createMajor: { title: (n) => `Add a major${n ? ` to ${n}` : ""}`, label: "Major name", action: "Add major" },
  editMajor: { title: (n) => `Rename ${n ?? "the major"}`, label: "Major name", action: "Save name" },
  deleteMajor: {
    title: (n) => `Delete the major ${n ?? ""}?`.replace("  ", " "),
    body: () => "Graduates will no longer see it in the survey. Answers already given are kept.",
    action: "Delete major",
    danger: true,
  },
};

const useAction = (modal: NonNullable<ModalState>, value: string) => {
  const id = modal.id ?? 0;
  const actions = {
    createDepartment: useCreateCollege(value),
    deleteDepartment: useRemoveDepartment(id),
    createProgram: useCreateProgram(value, id),
    editProgram: useEditProgram(id, value),
    deleteProgram: useRemoveProgram(id),
    createMajor: useCreateMajor(value, id),
    editMajor: useEditMajor(id, value),
    deleteMajor: useRemoveMajor(id),
  };
  return actions[modal.type];
};

function DialogBody({ modal, onClose }: { modal: NonNullable<ModalState>; onClose: () => void }) {
  const copy = COPY[modal.type];
  const isForm = Boolean(copy.label);
  const [value, setValue] = useState(modal.type.startsWith("edit") ? (modal.name ?? "") : "");
  const [error, setError] = useState("");
  const action = useAction(modal, value.trim());

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isForm && !value.trim()) {
      setError(`Enter the ${copy.label!.toLowerCase().replace(/,.*$/, "")}`);
      return;
    }
    try {
      await action.mutateAsync();
      onClose();
    } catch {
      /* the hook shows the server's message as a toast; the dialog stays open */
    }
  };

  return (
    <form method="dialog" onSubmit={submit} noValidate className="grid gap-5">
      <h2 id="app-dialog-title" className="text-[20px] font-bold">
        {copy.title(modal.name)}
      </h2>
      {copy.body && <p className="text-muted-foreground">{copy.body(modal.name)}</p>}
      {isForm && (
        <TextField
          id="app-dialog-input"
          label={copy.label}
          value={value}
          autoFocus
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          error={error}
        />
      )}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" onClick={onClose} autoFocus={!isForm}>
          Cancel
        </Button>
        <Button type="submit" variant={copy.danger ? "danger" : "primary"} loading={action.isPending}>
          {copy.action}
        </Button>
      </div>
    </form>
  );
}

export const AppModal = ({ modal, onClose }: { modal: ModalState; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (modal && !dialog.open) dialog.showModal();
    if (!modal && dialog.open) dialog.close();
  }, [modal]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="app-dialog-title"
      className="m-auto w-[min(100%-32px,480px)] rounded-xl border border-line p-6 text-ink shadow-[0_24px_64px_-16px_rgb(17_24_39/0.35)] backdrop:bg-[rgb(17_24_39/0.45)]"
    >
      {modal && <DialogBody key={`${modal.type}-${modal.id}`} modal={modal} onClose={onClose} />}
    </dialog>
  );
};

export default AppModal;
