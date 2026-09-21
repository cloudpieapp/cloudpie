import LegalPage from "@/components/LegalPage";
const sections = [
  { heading: "Company Details", bullets: [
    "Legal Name: CloudPie Inc.",
    "Type: Corporation",
    "Jurisdiction: Delaware, USA",
    "Registered Agent: Corporation Service Company, 251 Little Falls Drive, Wilmington, DE 19808",
    "Corporate Address: 811 Grand St, Alameda, CA 94501, USA",
  ]},
  { heading: "Service Provider Information", paragraphs: ["CloudPie Inc. is the service provider for the CloudPie streaming platform. We are committed to delivering a high-quality, reliable, and legal streaming experience."] },
  { heading: "Data Controller", paragraphs: ["For data protection and privacy matters, CloudPie Inc. acts as the data controller for personal information collected through the CloudPie service."] },
  { heading: "Contact Information", bullets: [
    "General Inquiries: hello.bingbloom@gmail.com",
    "Legal Notices: legal@bingbloom.com",
    "Privacy Matters: privacy@bingbloom.com",
    "DMCA Notices: dmca@bingbloom.com",
  ]},
  { heading: "Operating Status", paragraphs: ["CloudPie is fully operational and committed to providing free entertainment to users worldwide."] },
];
export default function Corporate() {
  return <LegalPage title="Corporate Information" description="Official company information, legal entity, registered office and contacts." intro="CloudPie is a digital entertainment platform dedicated to providing free, ad-supported streaming content to audiences worldwide." sections={sections} />;
}
