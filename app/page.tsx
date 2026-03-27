"use client";

import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturesSection from "@/components/FeaturesSection";
import JourneySection from "@/components/JourneySection";
import MethodologiesSection from "@/components/MethodologiesSection";
import TeamSection from "@/components/TeamSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <JourneySection />
      <MethodologiesSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
