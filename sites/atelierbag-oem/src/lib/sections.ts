import { sectionRegistry as sharedRegistry, sectionIds as sharedIds } from '@trade/sections/registry';
import AudiencesSection from '../components/sections/AudiencesSection.astro';

export const sectionRegistry = {
  ...sharedRegistry,
  'audience-cards': AudiencesSection,
};

export const sectionIds = sharedIds;
