"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface FilterOption {
  value: string
  count: number
}

interface FilterSidebarPoliciesProps {
  countries: FilterOption[]
  petTypes: FilterOption[]
}

export default function FilterSidebarPolicies({ countries, petTypes }: FilterSidebarPoliciesProps) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const currentFilters: Record<string, string> = {}
  if (segments.length > 2) {
    for (let i = 2; i < segments.length; i += 2) {
      currentFilters[segments[i]] = segments[i + 1]
    }
  }

  const buildUrl = (key: string, value: string) => {
    const newFilters = { ...currentFilters }
    if (newFilters[key] === value) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    let url = "/directory/policies"
    Object.entries(newFilters).forEach(([k, v]) => {
      url += `/${k}/${encodeURIComponent(v)}`
    })
    return url
  }

  const clearAllFilters = () => "/directory/policies"

  return (
    <Card className="w-full lg:w-72 sticky top-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filters</CardTitle>
        {Object.keys(currentFilters).length > 0 && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={clearAllFilters()}>
              <X className="mr-2 h-4 w-4" />
              Clear all
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Countries</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {countries.map((option) => (
                <Link key={option.value} href={buildUrl("country", option.value)}>
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded-md p-1 transition-colors">
                    <Checkbox id={`country-${option.value}`} checked={currentFilters["country"] === option.value} />
                    <Label htmlFor={`country-${option.value}`} className="flex-1 cursor-pointer">
                      {option.value} <span className="ml-1 text-muted-foreground">({option.count})</span>
                    </Label>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Pet Types</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {petTypes.map((option) => (
                <Link key={option.value} href={buildUrl("pet_type", option.value)}>
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded-md p-1 transition-colors">
                    <Checkbox id={`pet-${option.value}`} checked={currentFilters["pet_type"] === option.value} />
                    <Label htmlFor={`pet-${option.value}`} className="flex-1 cursor-pointer">
                      {option.value} <span className="ml-1 text-muted-foreground">({option.count})</span>
                    </Label>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

