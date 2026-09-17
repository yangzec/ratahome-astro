export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
}

export interface MegaMenu {
  id: string;
  label: string;
  href?: string;
  groups?: NavGroup[];
  feature?: {
    title: string;
    description: string;
    href: string;
    image: string;
  };
  links?: NavLink[];
}

export interface MetricItem {
  value: string;
  label: string;
}

export interface AssuranceItem {
  icon: string;
  title: string;
  description: string;
}

export interface CardItem {
  title: string;
  description: string;
  image?: string;
  href?: string;
}

export interface StepItem {
  step: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
}

export interface ProjectItem {
  location: string;
  delivery: string;
  type: string;
  title: string;
  scope: string;
  solution: string;
  image: string;
  href: string;
}

export interface PageSlugContent {
  title: string;
  description: string;
  content: string;
}
