import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedPGs from "@/components/FeaturedPGs";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  const { role } = useAuth();

  if (role === 'owner') {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-4">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties, bookings, and tenants.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, properties, and system settings.</p>
        </div>
        <Footer />
      </div>
    );
  }

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
