"use client";

import { useActionState } from "react";
import { updateMember, type UpdateMemberState } from "@/actions/admin/members";

const initialState: UpdateMemberState = { status: "idle" };
const inputClass =
  "rounded-lg border border-brand-600/25 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-shadow focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30";

export function EditMemberForm({
  userId,
  defaultValues,
}: {
  userId: string;
  defaultValues: {
    firstName: string;
    lastName: string;
    classGroup: string;
    role: string;
    isTeacher: boolean;
  };
}) {
  const action = updateMember.bind(null, userId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-brand-600/15 bg-white p-5 shadow-sm"
    >
      <h2 className="font-semibold text-brand-900">Gegevens</h2>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="firstName" className="text-sm text-zinc-600">
            Voornaam
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            defaultValue={defaultValues.firstName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="lastName" className="text-sm text-zinc-600">
            Achternaam
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            defaultValue={defaultValues.lastName}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="classGroup" className="text-sm text-zinc-600">
          Klas
        </label>
        <input
          id="classGroup"
          name="classGroup"
          placeholder="bv. 5A"
          defaultValue={defaultValues.classGroup}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm text-zinc-600">
          Rol
        </label>
        <select id="role" name="role" defaultValue={defaultValues.role} className={inputClass}>
          <option value="MEMBER">Lid</option>
          <option value="ADMIN">Beheerder</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" name="isTeacher" defaultChecked={defaultValues.isTeacher} />
        Leerkracht (uitgesloten van de beurtrol)
      </label>

      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
