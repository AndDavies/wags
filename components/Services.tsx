import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    title: "Pet Sitting",
    description: "Hourly, Daily, Weekly, and Monthly Rates",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    title: "Pet Hotel",
    description: "Daily, Weekly, and Monthly Rates",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    title: "Paw-dicure",
    description: "Grooming Services",
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    title: "Doggy Camp",
    description: "All summer long!",
    image: "/placeholder.svg?height=200&width=200",
  },
];

export function ServicesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#30B8C4]">
          Our Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.title} className="border-none shadow-lg">
              <CardHeader className="text-center p-0">
                <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden">
                  <Image
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="text-center mt-4">
                <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
