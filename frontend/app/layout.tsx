import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = 'https://eventifood.com'
const SITE_NAME = 'Eventifood'
const DEFAULT_TITLE = 'Eventifood — Food Van Software & QR Ordering App | No Monthly Fee'
const DEFAULT_DESCRIPTION =
  'The UK\'s food van ordering software. Give your food truck a branded QR-code store, live kitchen display board, queue management and full sales analytics. Free to set up — pay 2% only when you trade. Open in 30 minutes.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'food van software',
    'food truck software UK',
    'food truck ordering app',
    'food truck POS',
    'food van ordering system',
    'mobile catering software',
    'food truck queue management',
    'QR code food truck ordering',
    'food truck kitchen display',
    'food van app',
    'street food POS',
    'food truck EPOS UK',
    'food truck management software',
    'cashless food van',
    'food truck ordering software no monthly fee',
    'mobile catering QR ordering',
    'food truck analytics',
    'food van kitchen board',
    'food truck app UK',
    'mobile catering app',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Eventifood — Food Van Software & QR Ordering App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@eventifood',
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  category: 'technology',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
      description: DEFAULT_DESCRIPTION,
      areaServed: 'GB',
      knowsAbout: [
        'Food Truck Software',
        'QR Code Ordering',
        'Mobile Catering',
        'Point of Sale',
        'Kitchen Display Systems',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description: DEFAULT_DESCRIPTION,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
        description: 'Free to set up. Pay 2% per transaction when you trade.',
      },
      featureList: [
        'QR code food truck ordering',
        'Live kitchen display board',
        'Food truck queue management',
        'Sales analytics and profit tracking',
        'Printable menus with QR codes',
        'Cashless payments — card, Apple Pay, Google Pay',
        'Event and festival menus',
        'Inventory and stock management',
        'Customer order notifications',
        'No monthly fee',
      ],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/store/{search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white antialiased">
        {children}
      </body>
    </html>
  )
}
