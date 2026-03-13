import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = "Qraffle - Fair & Transparent Qubic Raffles with DAO Governance",
  description = "Participate in provably fair Qubic raffles with automatic token burning, charity donations, and DAO governance. Built on Qubic's transparent blockchain technology.",
  keywords = "qubic, raffles, blockchain, DAO, cryptocurrency, transparent, fair, token burning, charity",
  image = "/og-image.jpg",
  url = "https://qraffle.com",
  type = "website",
  noindex = false,
  structuredData,
}) => {
  const fullUrl = url.startsWith("http") ? url : `https://qraffle.com${url}`;
  const fullImageUrl = image.startsWith("http") ? image : `https://qraffle.com${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="Qraffle" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Structured Data */}
      {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
    </Helmet>
  );
};

export default SEO;
