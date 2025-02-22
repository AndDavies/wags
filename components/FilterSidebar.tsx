"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/DatePicker";

export interface FilterOption {
  value: string;
  count: number;
}

interface FilterSidebarProps {
  countries: FilterOption[];
  petTypes: FilterOption[];
  cabinOptions: FilterOption[];
  weightLimits: FilterOption[];
}

export function FilterSidebar({
  countries,
  petTypes,
  cabinOptions,
  weightLimits,
}: FilterSidebarProps) {
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

  const toggleSwitch = (key: string, checked: boolean) => {
    const newQueryString = createQueryString(key, checked ? "true" : "");
    router.push(`${pathname}?${newQueryString}`);
  };

  const handleDateChange = (date: Date | null, key: string) => {
    const newQueryString = createQueryString(key, date ? date.toISOString() : "");
    router.push(`${pathname}?${newQueryString}`);
  };

  return (
    <aside className="w-full md:w-72 space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Filter by</h2>

        <div className="flex items-center space-x-2">
          <Switch
            id="available"
            checked={searchParams.get("available") === "true"}
            onCheckedChange={(checked) => toggleSwitch("available", checked)}
          />
          <Label htmlFor="available">Show available only</Label>
        </div>

        <Accordion type="multiple" className="w-full">
          {/* Country Filter */}
          <AccordionItem value="country">
            <AccordionTrigger>Country</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {countries.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`country-${option.value}`}
                      checked={searchParams.get("country") === option.value}
                      onCheckedChange={() => toggleFilter("country", option.value)}
                    />
                    <Label htmlFor={`country-${option.value}`} className="flex-1">
                      {option.value}{" "}
                      <span className="ml-1 text-gray-500">({option.count})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Pet Type Filter */}
          <AccordionItem value="petType">
            <AccordionTrigger>Pet Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {petTypes.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pet-${option.value}`}
                      checked={searchParams.get("pet_type") === option.value}
                      onCheckedChange={() => toggleFilter("pet_type", option.value)}
                    />
                    <Label htmlFor={`pet-${option.value}`} className="flex-1">
                      {option.value}{" "}
                      <span className="ml-1 text-gray-500">({option.count})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Cabin Options Filter */}
          <AccordionItem value="cabin">
            <AccordionTrigger>Cabin Options</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {cabinOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cabin-${option.value}`}
                      checked={searchParams.get("cabin") === option.value}
                      onCheckedChange={() => toggleFilter("cabin", option.value)}
                    />
                    <Label htmlFor={`cabin-${option.value}`} className="flex-1">
                      {option.value}{" "}
                      <span className="ml-1 text-gray-500">({option.count})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Weight Limits Filter */}
          <AccordionItem value="weight">
            <AccordionTrigger>Weight Limit</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {weightLimits.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`weight-${option.value}`}
                      checked={searchParams.get("weight") === option.value}
                      onCheckedChange={() => toggleFilter("weight", option.value)}
                    />
                    <Label htmlFor={`weight-${option.value}`} className="flex-1">
                      {option.value}{" "}
                      <span className="ml-1 text-gray-500">({option.count})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Travel Dates Filter */}
          <AccordionItem value="dates">
            <AccordionTrigger>Travel Dates</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="from-date">From</Label>
                  <DatePicker
                    id="from-date"
                    selected={
                      searchParams.get("from")
                        ? new Date(searchParams.get("from")!)
                        : null
                    }
                    onSelect={(date) => handleDateChange(date, "from")}
                  />
                </div>
                <div>
                  <Label htmlFor="to-date">To</Label>
                  <DatePicker
                    id="to-date"
                    selected={
                      searchParams.get("to")
                        ? new Date(searchParams.get("to")!)
                        : null
                    }
                    onSelect={(date) => handleDateChange(date, "to")}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}
