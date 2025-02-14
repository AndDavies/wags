import Image from "next/image"

const AboutUs = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Our Story</h2>
            <p className="text-lg text-muted-foreground">
              Traveling taught us that pet adventures aren't always easy. Our family set out across Europe, Asia, Latin America, and beyond with our rescue dog, Baggo—navigating endless paperwork, vet certificates, and pet-friendly hotel searches.
            </p>
            <p className="text-lg text-muted-foreground">
              Frustrated by fragmented information, we created Wags Travel Hub to bring everything together in one trusted directory—so you can focus on enjoying the journey with your pet.
            </p>
          </div>
          <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl">
            <Image 
              src="/placeholders/bagsy_travel_2.jpg" 
              alt="Baggo, our rescue dog, enjoying travel adventures"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutUs