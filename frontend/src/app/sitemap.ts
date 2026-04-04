import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://starterscope.entrext.com'

  const routes = [
    '',
    '/sitemap',
    '/dashboard',
    '/acquisition-tiers',
    '/profile',
    '/contact',
    '/resources',
    '/privacy',
    '/terms',
    '/compliance',
    '/roadmap',
    '/business-plan',
    '/business-details',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/dashboard' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : route === '/dashboard' ? 0.9 : 0.7,
  }))
}
