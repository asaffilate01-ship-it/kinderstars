export type ContractType = "sfe_ccg" | "la_funded" | "employer" | "private" | "childminder";

export interface ContractData {
  parentName: string;
  parentAddress: string;
  parentPostcode: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childDob: string;
  childminderName: string;
  fundingRef: string;
  localAuthority: string;
  employerName: string;
  hoursPerWeek: string;
  ratePerHour: string;
  startDate: string;
  expiresAt: string;
  notes: string;
}

export const CONTRACT_TYPES: { value: ContractType; label: string; desc: string }[] = [
  { value: "sfe_ccg", label: "SFE / Childcare Grant (CCG)", desc: "For full-time students eligible for Student Finance England funding" },
  { value: "la_funded", label: "Local Authority 15/30 Hours", desc: "Government-funded early years entitlement" },
  { value: "employer", label: "Employer Childcare Scheme", desc: "Employer-sponsored childcare vouchers or schemes" },
  { value: "private", label: "Private / Self-Funded", desc: "Direct private payment arrangements" },
  { value: "childminder", label: "Childminder Employment", desc: "KinderStars ↔ Childminder agreement" },
];

export const defaultContractData: ContractData = {
  parentName: "", parentAddress: "", parentPostcode: "", parentEmail: "", parentPhone: "",
  childName: "", childDob: "", childminderName: "", fundingRef: "", localAuthority: "",
  employerName: "", hoursPerWeek: "", ratePerHour: "", startDate: "", expiresAt: "", notes: "",
};

export function getContractClauses(type: ContractType, data: ContractData) {
  const hoursText = data.hoursPerWeek ? `${data.hoursPerWeek} hours per week` : "hours as agreed";
  const rateText = data.ratePerHour ? `£${data.ratePerHour} per hour` : "the agreed rate";
  const startText = data.startDate ? new Date(data.startDate).toLocaleDateString("en-GB") : "the agreed date";

  const common = [
    { title: "Parties", body: `This agreement is between KinderStars Ltd ("the Agency") and ${data.parentName || "the named party"} ("the ${type === "childminder" ? "Childminder" : "Parent/Guardian"}").` },
    { title: "Commencement", body: `This contract shall commence on ${startText} and continue until terminated by either party with 4 weeks' written notice.` },
  ];

  if (type === "childminder") {
    return [
      ...common,
      { title: "Employment", body: `The Childminder is engaged by KinderStars Ltd to provide childcare services to families placed by the Agency. The Childminder is paid directly by KinderStars Ltd at ${rateText} for ${hoursText}.` },
      { title: "Duties", body: "The Childminder shall provide safe, nurturing childcare in accordance with Ofsted requirements, maintain valid DBS clearance, first aid certification, public liability insurance, and adhere to all KinderStars policies." },
      { title: "Payment", body: "KinderStars Ltd shall pay the Childminder via BACS on a monthly basis, based on approved timesheets. Payment terms are 14 days from invoice approval." },
      { title: "Compliance", body: "The Childminder must maintain current Ofsted registration, DBS clearance, paediatric first aid certification, and public liability insurance at all times." },
      { title: "Confidentiality", body: "The Childminder agrees to maintain strict confidentiality regarding all family, child, and business information obtained through KinderStars." },
      { title: "Termination", body: "Either party may terminate this agreement with 4 weeks' written notice. KinderStars reserves the right to terminate immediately for gross misconduct or safeguarding concerns." },
    ];
  }

  const paymentClause = type === "sfe_ccg"
    ? `Childcare costs are funded via Student Finance England Childcare Grant (CCG)${data.fundingRef ? ` (Ref: ${data.fundingRef})` : ""}. All invoices are issued by and payable to KinderStars Ltd. The Parent is responsible for ensuring their CCG application is maintained and funding continues. Note: The CCG is only available to those eligible for Student Finance England funding.`
    : type === "la_funded"
    ? `Childcare is delivered under the ${data.localAuthority || "Local Authority"} funded early years entitlement scheme. KinderStars Ltd invoices the Local Authority directly for funded hours. Any additional hours beyond the funded entitlement will be invoiced to the Parent at ${rateText}.`
    : type === "employer"
    ? `Childcare costs are partially or fully covered by the Parent's employer${data.employerName ? ` (${data.employerName})` : ""} childcare scheme. KinderStars Ltd invoices the employer directly. Any shortfall is invoiced to the Parent.`
    : `The Parent agrees to pay KinderStars Ltd at ${rateText} for ${hoursText}. Invoices are issued monthly and payable within 14 days.`;

  return [
    ...common,
    { title: "Child", body: `This contract covers childcare for ${data.childName || "the named child"}${data.childDob ? `, born ${new Date(data.childDob).toLocaleDateString("en-GB")}` : ""}.` },
    { title: "Services", body: `KinderStars Ltd shall provide ${hoursText} of Ofsted-registered childcare via an assigned childminder${data.childminderName ? ` (${data.childminderName})` : ""}. Care includes wraparound, school pick-up, holiday, and emergency cover as agreed.` },
    { title: "Payment & Invoicing", body: paymentClause },
    { title: "Agency Relationship", body: "The assigned childminder is engaged by and works for KinderStars Ltd. All payments for childcare services are made to KinderStars Ltd. The Parent's contractual relationship is with KinderStars Ltd, not the individual childminder." },
    { title: "Safeguarding", body: "All KinderStars childminders are Ofsted-registered, DBS-checked, hold valid paediatric first aid certificates, and are covered by public liability insurance." },
    { title: "Notice & Cancellation", body: "Either party may terminate with 4 weeks' written notice. Cancellation of booked sessions requires 48 hours' notice; late cancellations may be charged at full rate." },
    { title: "GDPR", body: "KinderStars Ltd processes personal data in accordance with UK GDPR. Data is used solely for the provision of childcare services and statutory obligations." },
  ];
}
