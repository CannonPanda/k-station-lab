export type Category = {
  id: string;
  name: string;
  desc: string;
};

export type Project = {
  id: string;
  name: string;
  url: string;
  homepage?: string;
  created: string;
  stars: number;
  summary: string;
  usage: string;
  category: string;
  added: string;
};

export type SiteMeta = {
  name: string;
  tagline: string;
  updated: string;
};

export type ProjectsData = {
  site: SiteMeta;
  categories: Category[];
  projects: Project[];
};
