import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import CustomerDashboard from "./CustomerDashboard";
import OwnerDashboard from "./OwnerDashboard";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedPGs from "@/components/FeaturedPGs";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin');
    }
  }, [role, navigate]);

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
