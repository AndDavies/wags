import { Search, Map, Plane } from 'lucide-react'

const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "Search & Discover",
      description: "Browse through curated lists of pet-friendly hotels, parks, and activities.",
    },
    {
      icon: <Map className="h-12 w-12 text-primary" />,
      title: "Plan Your Trip",
      description: "Use our intuitive tools to filter and select the best options for you and your pet.",
    },
    {
      icon: <Plane className="h-12 w-12 text-primary" />,
      title: "Book & Enjoy",
      description: "Easily make bookings and enjoy hassle-free travel with your furry companion.",
    },
  ]

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Our platform curates the best travel options and blog insights—making it easy for you to plan unforgettable adventures with your pet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              {step.icon}
              <h3 className="text-xl font-semibold mt-4 mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks