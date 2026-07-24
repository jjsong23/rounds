import { VenueForm } from "../_venue-form";
import { createVenue } from "../actions";

export default function NewVenuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">New venue</h1>
      <VenueForm action={createVenue} />
    </div>
  );
}
