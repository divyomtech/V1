import { Search, CheckCircle, Home, CreditCard } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search",
    description: "Browse through hundreds of verified PG listings in your preferred location",
  },
  {
    icon: CheckCircle,
    title: "Compare",
    description: "Compare prices, amenities, reviews, and photos to find your perfect match",
  },
  {
    icon: CreditCard,
    title: "Book",
    description: "Secure your room with easy online payment and instant confirmation",
  },
  {
    icon: Home,
    title: "Move In",
    description: "Pack your bags and move into your new home hassle-free",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Finding your perfect PG is just 4 simple steps away
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <step.icon className="h-10 w-10 text-primary" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
