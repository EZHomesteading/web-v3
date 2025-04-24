import React from "react";
import { auth } from "@/auth";
import Calendar from "@/features/availability-calendar/components/main/calendar";
import { Location } from "@prisma/client";
import { getUserLocations } from "@/actions/getLocations";

interface EditLocationPageProps {
  params: { id: string };
}

export default function EditLocationPage({ params }: EditLocationPageProps) {
  // Use Promise.resolve for params to satisfy Next.js's expectation
  return EditLocationPageContent({ params });
}

// Create a separate async component for the actual content
async function EditLocationPageContent({ params }: EditLocationPageProps) {
  const session = await auth();
  const locationId = params.id;
  console.log(params.id);

  const userId = session?.user?.id;
  const locations = await getUserLocations({ userId });
  const location = locations.find((loc) => loc.id === locationId);
  console.log(location?.name);

  if (location?.userId !== userId) {
    return (
      <div className="flex w-full h-2/3 items-center justify-center">
        Invalid location or unauthorized access.
      </div>
    );
  }

  const mk = process.env.MAPS_KEY!;
  return (
    <>
      <Calendar
        location={location}
        id={locationId}
        mk={mk}
        locations={locations}
        userId={session?.user?.id}
      />
    </>
  );
}
