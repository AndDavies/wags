"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface FilterOption {
  value: string;
  count: number;
}

interface FilterSidebarAirlinesProps {
  countries: FilterOption[];
  // You can add additional airline-specific filter props here.
}

export default function FilterSidebarAirlines({ countries }: FilterSidebarAirlinesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Optionally log analytics here:
      // logAnalytics({ event: "filter-change", filter: name, value });
      return params.toString();
    },
    [searchParams]
  );

  const toggleFilter = (key: string, value: string) => {
    const current = searchParams.get(key);
    const newValue = current === value ? "" : value;
    const newQueryString = createQueryString(key, newValue);
    router.push(`${pathname}?${newQueryString}`);
  };

  return (
    <aside className="w-full md:w-72 space-y-6">
      <h2 className="text-xl font-semibold">Airlines Filters</h2>
      <div className="space-y-2">
        {countries.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`country-${option.value}`}
              checked={searchParams.get("country") === option.value}
              onCheckedChange={() => toggleFilter("country", option.value)}
            />
            <Label htmlFor={`country-${option.value}`} className="flex-1">
              {option.value} <span className="ml-1 text-gray-500">({option.count})</span>
            </Label>
          </div>
        ))}
      </div>
    </aside>
  );
}
