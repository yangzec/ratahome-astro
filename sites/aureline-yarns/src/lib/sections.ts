import { sectionRegistry as sharedRegistry, sectionIds as sharedIds } from '@trade/sections/registry';
import AudiencesSection from '../components/sections/AudiencesSection.astro';
import CapabilitiesSection from '../components/sections/CapabilitiesSection.astro';
import EcosystemSection from '../components/sections/EcosystemSection.astro';
import WarrantySection from '../components/sections/WarrantySection.astro';

export const sectionRegistry = {
  ...sharedRegistry,
  'audience-cards': AudiencesSection,
  'capabilities-grid': CapabilitiesSection,
  ecosystem: EcosystemSection,
  'warranty-cases': WarrantySection,
};

export const sectionIds = sharedIds;
