import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PawPrint, Plane, Globe, Heart } from "lucide-react"
import Link from "next/link"

const AboutUs = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-primary">Our Story</h2>
            <p className="text-lg text-muted-foreground">
              Traveling taught us that pet adventures aren&apos;t always easy. Our family set out across Europe, Asia,
              Latin America, and beyond with our rescue dog, Baggo—navigating endless paperwork, vet certificates, and
              pet-friendly hotel searches.
            </p>
            <p className="text-lg text-muted-foreground">
              Frustrated by fragmented information, we created Wags Travel Hub to bring everything together in one
              trusted directory—so you can focus on enjoying the journey with your pet.
            </p>
            <div className="pt-4">
              <Button asChild>
                <Link href="/about">Learn More About Us</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/placeholders/bagsy_family_travel.jpeg"
                alt="Baggo, our rescue dog, enjoying travel adventures"
                fill
                className="object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <PawPrint className="h-6 w-6" />, text: "Pet-Friendly" },
                { icon: <Plane className="h-6 w-6" />, text: "Travel Experts" },
                { icon: <Globe className="h-6 w-6" />, text: "Global Coverage" },
                { icon: <Heart className="h-6 w-6" />, text: "Passionate Team" },
              ].map((item, index) => (
                <Card key={index}>
                  <CardContent className="flex items-center space-x-4 p-4">
                    {item.icon}
                    <span className="text-sm font-medium">{item.text}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutUs

