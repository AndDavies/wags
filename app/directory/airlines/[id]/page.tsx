import React from "react";
import { getAirlines } from "@/lib/directory";
import { Airplay, MapPin, DollarSign, Calendar } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AirlineDetailPageProps {
  params: { id: string };
}

export default async function AirlineDetailPage({ params }: AirlineDetailPageProps) {
  const airlines = await getAirlines();
  const airline = airlines.find((item) => String(item.id) === params.id);

  if (!airline) {
    return (
      <div className="container mx-auto p-4">
        <DirectoryBreadcrumb currentCategory="airlines" />
        <Card className="mt-8">
          <CardContent className="pt-6">
            <p className="text-center text-lg text-gray-500">Airline not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DirectoryBreadcrumb currentCategory="airlines" />
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <Airplay className="h-10 w-10 text-primary" />
          <div>
            <CardTitle className="text-3xl font-bold">{airline.name}</CardTitle>
            <Badge className="mt-2 bg-blue-500">{airline.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {airline.country && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>
                <strong>Country:</strong> {airline.country}
              </span>
            </div>
          )}
          {airline.fee !== undefined && airline.fee !== null && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <span>
                <strong>Pet Fee:</strong> ${airline.fee}
              </span>
            </div>
          )}
          {airline.last_updated && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span>
                <strong>Last Updated:</strong> {new Date(airline.last_updated).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            For more detailed information about {airline.name}&apos;s pet policies, including carrier requirements, breed
            restrictions, and in-cabin rules, please visit the airline&apos;s official website or contact their customer
            service directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
