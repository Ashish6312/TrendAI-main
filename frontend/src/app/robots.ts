import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://starterscope.entrext.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/auth/',
        '/payment-success/',
        '/profile/', // Personal data should not be indexed
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
