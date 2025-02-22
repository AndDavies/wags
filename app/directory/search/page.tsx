// app/directory/search/page.tsx
import Link from "next/link";
// Use "Airplane" instead of "AirplaneIcon" if that's what's exported.
import { Airplay, BedIcon, FileTextIcon } from "lucide-react";

export default function SearchLandingPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Pet Travel Directory</h1>
      <div className="flex justify-around">
        <Link
          href="/directory/search/airlines"
          className="flex flex-col items-center space-y-2 hover:text-primary"
        >
          <Airplay className="h-10 w-10" />
          <span>Airlines</span>
        </Link>
        <Link
          href="/directory/search/hotels"
          className="flex flex-col items-center space-y-2 hover:text-primary"
        >
          <BedIcon className="h-10 w-10" />
          <span>Hotels</span>
        </Link>
        <Link
          href="/directory/search/policies"
          className="flex flex-col items-center space-y-2 hover:text-primary"
        >
          <FileTextIcon className="h-10 w-10" />
          <span>Policies</span>
        </Link>
      </div>
    </div>
  );
}
