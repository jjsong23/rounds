import { GroupForm } from "../_group-form";
import { adminCreateGroup } from "../actions";

export default function NewGroupPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">New group</h1>
      <GroupForm action={adminCreateGroup} />
    </div>
  );
}
