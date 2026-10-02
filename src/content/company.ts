import type { CompanyProfile } from "@/types/company";

export const DEFAULT_COMPANY: CompanyProfile = {
  id: "northstar-labs",
  name: "Northstar Labs",
  blurb:
    "Northstar Labs builds developer tools that help product teams ship reliable software faster.",
  products: ["Release dashboard", "Observability starter kit", "API gateway"],
  values: ["Ownership", "Clarity", "Continuous learning"],
};
