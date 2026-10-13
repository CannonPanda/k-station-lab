import { StationApp } from "@/components/StationApp";
import { categories, projects, siteMeta } from "@/lib/data";

export default function HomePage() {
  return (
    <StationApp
      projects={projects}
      categories={categories}
      updated={siteMeta.updated}
    />
  );
}
