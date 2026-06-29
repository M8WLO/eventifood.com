import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://eventifood.com'
  const now = new Date().toISOString()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/food-truck-pos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/qr-code-ordering`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/mobile-catering-software`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/food-truck-queue-management`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}
