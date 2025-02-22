"use client";

import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, DollarSignIcon } from "lucide-react";
import type { DirectoryItem } from "@/lib/directory";

interface DirectoryItemCardProps {
  item: DirectoryItem;
}

const DirectoryItemCard: React.FC<DirectoryItemCardProps> = ({ item }) => {
  const getTypeColor = (type: DirectoryItem["type"]) => {
    switch (type) {
      case "airlines":
        return "bg-blue-500";
      case "pet_policies":
        return "bg-green-500";
      case "hotels":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const typeLabel =
    item.type === "airlines"
      ? "Airline"
      : item.type === "pet_policies"
      ? "Pet Policy"
      : "Hotel";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {item.name}
          </CardTitle>
          <Badge className={`${getTypeColor(item.type)} text-white`}>
            {typeLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {item.country && (
            <div className="flex items-center text-gray-500">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {item.country}
            </div>
          )}
          {item.fee !== undefined && item.fee !== null && (
            <div className="flex items-center text-gray-500">
              <DollarSignIcon className="h-4 w-4 mr-2" />
              ${item.fee}
            </div>
          )}
          <div className="flex items-center text-gray-500 text-xs">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Updated: {formatDate(item.last_updated)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DirectoryItemCard;
