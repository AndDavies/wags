"use client";

import React from "react";
import Link from "next/link";
import { Airplay, BedIcon, FileTextIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DirectoryBreadcrumbProps {
  currentCategory: "airlines" | "hotels" | "policies";
  extraItems?: BreadcrumbItem[];
}

export default function DirectoryBreadcrumb({ currentCategory, extraItems }: DirectoryBreadcrumbProps) {
  // Always render the main category as a link so that on an item page the user can click it to return
  const mainCategoryLink = `/directory/${currentCategory}`;

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
          <Link
            href={mainCategoryLink}
            className="text-muted-foreground hover:text-primary transition-colors font-semibold capitalize"
          >
            {currentCategory}
          </Link>
        </li>
        {extraItems &&
          extraItems.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <li>
                {item.href ? (
                  <Link href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-semibold">{item.label}</span>
                )}
              </li>
            </React.Fragment>
          ))}
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
  );
}
