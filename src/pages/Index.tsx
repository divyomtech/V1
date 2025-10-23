import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedPGs from "@/components/FeaturedPGs";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturedPGs />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
