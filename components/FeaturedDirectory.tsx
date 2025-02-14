import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Hotel, MapPin } from 'lucide-react'

const FeaturedDirectory = () => {
  const features = [
    {
      title: "Airline Deals",
      description: "Exclusive offers on pet-friendly flights.",
      icon: <Plane className="h-6 w-6" />,
      image: "/placeholders/placeholder_image_18.jpg",
      link: "/directory/airlines",
    },
    {
      title: "Hotel Deals",
      description: "Stay at pet-friendly hotels around the world.",
      icon: <Hotel className="h-6 w-6" />,
      image: "/placeholders/placeholder_image_24.jpg",
      link: "/directory/hotels",
    },
    {
      title: "Activities",
      description: "Adventure activities perfect for pet travelers.",
      icon: <MapPin className="h-6 w-6" />,
      image: "/placeholders/placeholder_image_13.jpg",
      link: "/directory/activities",
    },
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Featured Deals & Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={feature.image || "/placeholder.svg"}
                  alt={feature.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {feature.icon}
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="link">
                  <Link href={feature.link}>Explore</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedDirectory