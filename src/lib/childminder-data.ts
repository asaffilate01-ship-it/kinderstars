export interface Childminder {
  id: string;
  firstName: string;
  lastInitial: string;
  town: string;
  postcodeDistrict: string;
  verified: boolean;
  verificationTier: "registered" | "verified" | "jugendamt_approved";
  ageGroups: string[];
  days: string[];
  hours: string;
  languages: string[];
  experienceYears: number | null;
  bio: string;
}

/** Map a database row to our Childminder interface */
export function rowToChildminder(row: any): Childminder {
  return {
    id: row.id,
    firstName: row.first_name,
    lastInitial: row.last_initial,
    town: row.town,
    postcodeDistrict: row.postcode_district,
    verified: row.verified,
    verificationTier: (row.verification_tier as Childminder["verificationTier"]) ?? "registered",
    ageGroups: row.age_groups ?? [],
    days: row.days ?? [],
    hours: row.hours ?? "",
    languages: row.languages ?? [],
    experienceYears: row.experience_years,
    bio: row.bio ?? "",
  };
}

/** Map our Childminder interface to a database row */
export function childminderToRow(cm: Childminder) {
  return {
    id: cm.id,
    first_name: cm.firstName,
    last_initial: cm.lastInitial,
    town: cm.town,
    postcode_district: cm.postcodeDistrict,
    verified: cm.verified,
    verification_tier: cm.verificationTier,
    age_groups: cm.ageGroups,
    days: cm.days,
    hours: cm.hours,
    languages: cm.languages,
    experience_years: cm.experienceYears,
    bio: cm.bio,
  };
}

export function makeEnquiryMailto(cm: Childminder) {
  const subject = encodeURIComponent(`Kinderbetreuungs-Anfrage – ${cm.id} (${cm.postcodeDistrict})`);
  const body = encodeURIComponent(
    `Hallo KinderStars,\n\nIch möchte mich informieren zu: ${cm.firstName} ${cm.lastInitial}. (Ref: ${cm.id})\n\nMeine PLZ:\nAlter der Kinder:\nBenötigte Tage/Zeiten:\nStartdatum:\nWeitere Hinweise:\n\nVielen Dank,`
  );
  return `mailto:info@kinderstars.de?subject=${subject}&body=${body}`;
}
