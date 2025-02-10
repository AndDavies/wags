"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Card as ShadcnCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

interface CustomCardProps {
  title: string
  image?: string
  rating?: number
  description?: string
  href?: string
  price?: string
}

export function Card({
  title,
  image,
  rating,
  description,
  href,
  price,
}: CustomCardProps) {
  return (
    <ShadcnCard className="overflow-hidden">
      {/* Optional image at the top */}
      {image && (
        <div className="relative h-48 w-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={false}
          />
        </div>
      )}

      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {rating && (
          <CardDescription>
            {rating.toFixed(1)} ★
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {price && <p className="mt-2 font-semibold">{price}</p>}
      </CardContent>

      {/* Footer could hold a CTA link or more info */}
      {href && (
        <CardFooter>
          <Link href={href} className="text-sm font-medium text-blue-600 hover:underline">
            Learn More
          </Link>
        </CardFooter>
      )}
    </ShadcnCard>
  )
}
