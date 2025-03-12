// components/HowItWorks.tsx
import { MapPin, FileText, Heart } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <MapPin className="h-12 w-12 text-[#30B8C4]" />,
      title: "Plan with Love",
      description: "We create a custom itinerary for you and your pet, scheduling vet visits and aligning every detail for a smooth journey.",
    },
    {
      icon: <FileText className="h-12 w-12 text-[#30B8C4]" />,
      title: "Simplify the Rules",
      description: "From permits to airline policies, we guide you through country requirements, keeping all documents in one safe place.",
    },
    {
      icon: <Heart className="h-12 w-12 text-[#30B8C4]" />,
      title: "Travel with Joy",
      description: "With everything prepared, explore the world with your pet, confident and free from stress.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#30B8C4]">
          Your Journey, Made Simple—Step by Step
        </h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          We’ve been where you are—planning pet travel can feel overwhelming. Wags & Wanders takes the worry away, 
          so you can create unforgettable memories with your furry companion.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
              {step.icon}
              <h3 className="text-xl font-semibold mt-4 mb-2 text-[#30B8C4]">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;