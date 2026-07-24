const TYPES = ["users", "venues", "groups", "rounds", "tags", "attendance", "offer-matches"];

export default function AdminExportPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">CSV export</h1>
      <ul className="list-disc pl-5 text-sm">
        {TYPES.map((t) => (
          <li key={t}>
            <a href={`/api/admin/export/${t}`} className="underline">
              {t}.csv
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
