import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, FileText, ArrowRight } from "lucide-react";

const FeaturedDirectory = () => {
  const directories = [
    {
      title: "Pet-Friendly Airlines",
      description: "Comprehensive guide to airline policies for pet travel.",
      icon: <Plane className="h-8 w-8 text-brand-teal" />,
      image: "/placeholders/Pet_Friendly_Airlines.png",
      link: "/directory/airlines",
      features: ["Cabin policies", "Cargo regulations", "Breed restrictions"],
    },
    {
      title: "Pet-Friendly Hotels",
      description: "Find accommodations that welcome your furry companions.",
      icon: <Hotel className="h-8 w-8 text-brand-teal" />,
      image: "/placeholders/Pet_Friendly_Hotels.png",
      link: "/directory/hotels",
      features: ["Pet amenities", "Size restrictions", "Additional fees"],
    },
    {
      title: "Country Import Policies",
      description: "Navigate international pet travel requirements with ease.",
      icon: <FileText className="h-8 w-8 text-brand-teal" />,
      image: "/placeholders/Pet_Travel_Policies.png",
      link: "/directory/policies",
      features: ["Vaccination requirements", "Quarantine info", "Necessary paperwork"],
    },
  ];

  return (
    <section className="py-16 bg-brand-pink">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-display text-brand-teal text-center mb-4">
          Your Pet Travel Resource Hub
        </h2>
        <p className="text-center text-offblack mb-12 max-w-2xl mx-auto">
          Comprehensive directories to guide you through every aspect of traveling with your pet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {directories.map((directory, index) => (
            <Card key={index} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg bg-white">
              <div className="relative h-48">
                <Image
                  src={directory.image || "/placeholder.svg"}
                  alt={directory.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-brand-teal bg-opacity-40 flex items-center justify-center">
                  {directory.icon}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-brand-teal">{directory.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-offblack mb-4">{directory.description}</p>
                <ul className="space-y-2">
                  {directory.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-offblack">
                      <ArrowRight className="h-4 w-4 mr-2 text-brand-teal" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
                  <Link href={directory.link}>Explore {directory.title}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDirectory;
