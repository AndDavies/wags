"use client"

import Link from "next/link"
import { Airplay, BedIcon, FileTextIcon, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DirectoryBreadcrumbProps {
  currentCategory: "airlines" | "hotels" | "policies"
}

export default function DirectoryBreadcrumb({ currentCategory }: DirectoryBreadcrumbProps) {
  return (
    <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
            Home
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <li>
          <Link href="/directory" className="text-muted-foreground hover:text-primary transition-colors">
            Directory
          </Link>
        </li>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <li>
          <span className="font-semibold capitalize">{currentCategory}</span>
        </li>
      </ol>
      <div className="flex items-center space-x-2">
        <Button variant={currentCategory === "airlines" ? "default" : "ghost"} size="sm" asChild>
          <Link href="/directory/airlines">
            <Airplay className="h-4 w-4 mr-2" />
            Airlines
          </Link>
        </Button>
        <Button variant={currentCategory === "hotels" ? "default" : "ghost"} size="sm" asChild>
          <Link href="/directory/hotels">
            <BedIcon className="h-4 w-4 mr-2" />
            Hotels
          </Link>
        </Button>
        <Button variant={currentCategory === "policies" ? "default" : "ghost"} size="sm" asChild>
          <Link href="/directory/policies">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Policies
          </Link>
        </Button>
      </div>
    </nav>
  )
}

