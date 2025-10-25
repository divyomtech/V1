import { useAuth } from "@/hooks/useAuth";
import CustomerDashboard from "./CustomerDashboard";
import OwnerDashboard from "./OwnerDashboard";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedPGs from "@/components/FeaturedPGs";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (role === 'owner') {
    return <OwnerDashboard />;
  }

  if (role === 'customer') {
    return <CustomerDashboard />;
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

  // Default landing page for non-authenticated users
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
