import HeroSection from './sections/HeroSection.astro';
import AssuranceBar from './sections/AssuranceBar.astro';
import MetricsBar from './sections/MetricsBar.astro';
import AudiencesSection from './sections/AudiencesSection.astro';
import CapabilitiesSection from './sections/CapabilitiesSection.astro';
import ProcessSection from './sections/ProcessSection.astro';
import TestimonialsSection from './sections/TestimonialsSection.astro';
import WarrantySection from './sections/WarrantySection.astro';
import RoomsSection from './sections/RoomsSection.astro';
import ProjectsSection from './sections/ProjectsSection.astro';
import EcosystemSection from './sections/EcosystemSection.astro';
import ContactCTA from './sections/ContactCTA.astro';

/** Blueprint section ID → Astro component */
export const sectionRegistry: Record<string, unknown> = {
  'hero-fullbleed': HeroSection,
  'assurance-bar': AssuranceBar,
  'metrics-bar': MetricsBar,
  'audience-cards': AudiencesSection,
  'capabilities-grid': CapabilitiesSection,
  'process-timeline': ProcessSection,
  testimonials: TestimonialsSection,
  'warranty-cases': WarrantySection,
  'rooms-grid': RoomsSection,
  'projects-showcase': ProjectsSection,
  ecosystem: EcosystemSection,
  'contact-cta': ContactCTA,
};

export const sectionIds = Object.keys(sectionRegistry);
