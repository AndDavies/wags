import Link from "next/link"
import { Airplay, BedIcon, FileTextIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function DirectoryHomePage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">Pet Travel Directory</h1>
      <p className="text-center text-lg text-muted-foreground mb-8">
        Find pet-friendly airlines, hotels, and travel policies for your next adventure.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            href: "/directory/airlines",
            icon: Airplay,
            title: "Airlines",
            description: "Find pet-friendly airlines for your journey",
          },
          {
            href: "/directory/hotels",
            icon: BedIcon,
            title: "Hotels",
            description: "Discover accommodations that welcome your furry friends",
          },
          {
            href: "/directory/policies",
            icon: FileTextIcon,
            title: "Policies",
            description: "Learn about pet travel regulations and guidelines",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="flex flex-col items-center space-y-4 p-6">
                <item.icon className="h-16 w-16 text-primary" />
                <h2 className="text-2xl font-semibold">{item.title}</h2>
                <p className="text-center text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

