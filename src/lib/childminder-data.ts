export interface Childminder {
  id: string;
  firstName: string;
  lastInitial: string;
  town: string;
  postcodeDistrict: string;
  verified: boolean;
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
    age_groups: cm.ageGroups,
    days: cm.days,
    hours: cm.hours,
    languages: cm.languages,
    experience_years: cm.experienceYears,
    bio: cm.bio,
  };
}

export function makeEnquiryMailto(cm: Childminder) {
  const subject = encodeURIComponent(`Childcare Enquiry – ${cm.id} (${cm.postcodeDistrict})`);
  const body = encodeURIComponent(
    `Hello KinderStars,\n\nI would like to enquire about: ${cm.firstName} ${cm.lastInitial}. (Ref: ${cm.id})\n\nMy postcode (district is fine):\nChild age(s):\nDays/hours needed:\nStart date:\nAny extra notes:\n\nThank you,`
  );
  return `mailto:info@kinderstars.co.uk?subject=${subject}&body=${body}`;
}
