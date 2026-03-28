// Real Business Data API Integration
// This service fetches real business data from various sources

interface RealBusiness {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  status: 'active' | 'closed' | 'unknown';
  distance?: string;
  established?: string;
  category?: string;
  coordinates?: { lat: number; lng: number };
  social_media?: any[];
  opening_hours?: any[];
  price_level?: string;
  source?: string;
}


interface BusinessSearchParams {
  businessType: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  radius?: number; // in kilometers
}

class RealBusinessAPI {
  // Overpass mirror servers — race them for fastest response
  private readonly OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  async searchBusinesses(params: BusinessSearchParams): Promise<RealBusiness[]> {
    // For city-wide results like Bhopal, use a wider radius (15-20km) 
    // instead of a 3km neighborhood search.
    const { location, coordinates, radius = 15 } = params;
    
    if (!coordinates) {
      console.warn('No coordinates provided for business search');
      return [];
    }

    console.log(`🌐 Searching broad area (${radius}km) for '${params.businessType}' in ${location}...`);
    
    // Extract city name for Nominatim
    const safeLocation = (location || 'India').toString();
    const cityName = safeLocation.split(',')[0].trim();

    try {
      // Race Overpass (map data) vs Nominatim (search API)
      const [overpassResult, nominatimResult] = await Promise.allSettled([
        this.searchOverpassFast(coordinates, params.businessType, radius),
        this.searchNominatim(cityName, params.businessType, coordinates),
      ]);

      const overpassData = overpassResult.status === 'fulfilled' ? overpassResult.value : [];
      const nominatimData = nominatimResult.status === 'fulfilled' ? nominatimResult.value : [];

      // Merge, deduplicate by name, prefer Overpass (richer data)
      const combined = [...overpassData];
      for (const n of nominatimData) {
        if (!combined.some(b => b.name.toLowerCase() === n.name.toLowerCase())) {
          combined.push(n);
        }
      }

      if (combined.length > 0) {
        console.log(`✅ Got ${overpassData.length} from Overpass + ${nominatimData.length} from Nominatim = ${combined.length} real businesses`);
        return combined;
      }
    } catch {
      // Both sources failed — fall through to AI
    }

    console.log(`📡 Live sources exhausted for ${location}. Zero Fallback Policy enforced: No synthetic data.`);
    return [];
  }

  /** 🔥 NEW: Deep extract contacts, social profiles and reviews via Apify (PRO feature) */
  async deepScrapeBusinesses(query: string, location: string, email?: string): Promise<{ data: RealBusiness[], summary?: string }> {
    console.log(`🚀 Deep scraping for '${query}' in ${location}...`);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trendai-api.onrender.com';
      const res = await fetch(`${apiUrl}/api/businesses/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          location,
          max_results: 50,
          email
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Scraping failed');
      }

      const responseData = await res.json();
      if (responseData.success) {
        console.log(`✅ Deep scrape successful! Got ${responseData.data.length} enriched results.`);
        return {
          data: responseData.data.map((b: any) => {
            const sm: any = {};
            if (Array.isArray(b.social_media)) {
               b.social_media.forEach((item: any) => {
                 if (item.url && item.url.includes('instagram.com')) sm.instagram = item.url;
                 if (item.url && item.url.includes('facebook.com')) sm.facebook = item.url;
                 if (item.url && item.url.includes('twitter.com') || item.url && item.url.includes('x.com')) sm.twitter = item.url;
               });
            }
            return {
              ...b,
              social_media: sm
            };
          }),
          summary: responseData.summary
        };
      }
      return { data: [] };
    } catch (error) {
      console.error('Deep scrape failed:', error);
      return { data: [] };
    }
  }


  /** Nominatim free-text search — returns real OSM POIs by business type + city */
  private async searchNominatim(
    city: string,
    businessType: string,
    centerCoords: { lat: number; lng: number }
  ): Promise<RealBusiness[]> {
    // Simplify business type to a short, highly-searchable OSM keyword
    let cleanType = businessType.toLowerCase()
      .replace(/\s+for\s+.+/gi, '') // Remove everything after "for"
      .replace(/\s+in\s+.+/gi, '')  // Remove everything after "in"
      .replace(/business/gi, '')
      .replace(/agency/gi, '')
      .replace(/company/gi, '')
      .replace(/services/gi, '')
      .trim();
      
    // Nominatim works best with single strong keywords
    const typeWords = cleanType.split(' ').filter(Boolean);
    if (typeWords.length > 0) {
      if (cleanType.includes('renewable') || cleanType.includes('energy') || cleanType.includes('solar')) cleanType = 'solar';
      else if (cleanType.includes('tech') || cleanType.includes('software')) cleanType = 'software';
      else if (cleanType.includes('food') || cleanType.includes('restaurant')) cleanType = 'restaurant';
      else if (cleanType.includes('health') || cleanType.includes('medical')) cleanType = 'clinic';
      else cleanType = typeWords[0]; // fallback to first major word
    }

    const query = encodeURIComponent(`${cleanType} ${city}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      // 🚀 Point to our secure backend proxy to bypass browser CORS & rate limits
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trendai-api.onrender.com';
      const res = await fetch(
        `${apiUrl}/api/businesses/search?q=${query}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeout);

      if (!res.ok) return [];
      const jsonResponse = await res.json();
      const data: any[] = jsonResponse.data || [];

      return data
        .filter(item => item.display_name && item.lat && item.lon)
        .map(item => {
          const itemCoords = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
          const addr = item.address || {};
          const addressParts = [
            addr.house_number,
            addr.road,
            addr.suburb,
            addr.city || addr.town || addr.village || city,
          ].filter(Boolean).join(', ');

          return {
            name: item.display_name.split(',')[0] || item.display_name,
            address: addressParts || item.display_name.split(',').slice(0, 3).join(',').trim(),
            status: 'active' as const,
            distance: this.calculateDistance(centerCoords, itemCoords),
            category: item.type || cleanType,
            coordinates: itemCoords,
          } as RealBusiness;
        });
    } catch {
      clearTimeout(timeout);
      return [];
    }
  }

  /** Fetch Overpass API via the secure Backend Proxy to bypass browser 403s & rate limits */
  private async searchOverpassFast(
    coordinates: { lat: number; lng: number },
    businessType: string,
    radius: number
  ): Promise<RealBusiness[]> {
    const osmTags = this.getOSMTags(businessType);
    // Lighter query: max 8 seconds, limit 25
    const query = this.buildLightOverpassQuery(coordinates, radius, osmTags);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 s hard cap

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trendai-api.onrender.com';
      const res = await fetch(`${apiUrl}/api/businesses/overpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      const data = await res.json();
      clearTimeout(timeout);

      if (!res.ok || data.elements?.length === 0) {
        return [];
      }

      return this.parseOverpassResults(data, coordinates);
    } catch (error: any) {
      clearTimeout(timeout);
      return [];
    }
  }

  /** Lightweight Overpass query: short server timeout, named nodes only */
  private buildLightOverpassQuery(
    coordinates: { lat: number; lng: number },
    radius: number,
    tags: string[]
  ): string {
    const { lat, lng } = coordinates;
    const radiusMeters = radius * 1000;
    // Use up to 4 tags for specificity
    const tagQueries = tags.slice(0, 4)
      .map(tag => `node["${tag.replace('=', '"="')}"](around:${radiusMeters},${lat},${lng});`)
      .join('\n  ');

    // Neural Discovery Limit (150) for broad city scans, 60 for local dense scans
    const limit = radius >= 15 ? 150 : 60;
    return `[out:json][timeout:25];(\n  ${tagQueries}\n);out ${limit};`;
  }


  private getOSMTags(businessType: string): string[] {
    const typeMap: Record<string, string[]> = {
      'renewable': ['office=energy', 'industrial=energy', 'shop=solar', 'power=plant'],
      'energy': ['office=energy', 'shop=solar', 'amenity=fuel'],
      'solar': ['shop=solar', 'industrial=energy', 'office=energy'],
      'wind': ['power=plant', 'industrial=energy'],
      'restaurant': ['amenity=restaurant', 'amenity=fast_food', 'amenity=cafe'],
      'hotel': ['tourism=hotel', 'tourism=motel', 'tourism=guest_house'],
      'shop': ['shop=*', 'amenity=marketplace'],
      'office': ['office=*', 'amenity=coworking_space'],
      'digital': ['office=it', 'shop=computer', 'amenity=internet_cafe'],
      'marketing': ['office=advertising', 'office=marketing'],
      'consulting': ['office=consulting', 'office=financial'],
      'retail': ['shop=*', 'amenity=marketplace'],
      'service': ['office=*', 'craft=*'],
      'healthcare': ['amenity=hospital', 'amenity=clinic', 'amenity=pharmacy'],
      'education': ['amenity=school', 'amenity=university', 'amenity=college', 'amenity=library'],
      'edtech': ['office=it', 'office=software', 'amenity=school', 'amenity=university'],
      'software': ['office=it', 'office=software', 'office=telecommunication'],
      'tech': ['office=it', 'shop=computer', 'shop=electronics', 'office=software'],
      'contractor': ['office=contractor', 'craft=builder', 'craft=carpenter', 'office=estate_agent'],
      'construction': ['office=construction', 'craft=builder', 'industrial=warehouse'],
      'logistics': ['office=logistics', 'industrial=warehouse', 'amenity=transportation'],
      'fitness': ['leisure=fitness_centre', 'leisure=sports_centre'],
      'beauty': ['shop=beauty', 'shop=hairdresser', 'amenity=spa'],
      'automotive': ['shop=car', 'shop=car_repair', 'amenity=fuel'],
      'food': ['amenity=restaurant', 'amenity=cafe', 'shop=bakery'],
      'technology': ['office=it', 'shop=computer', 'shop=electronics']
    };

    // Find matching tags based on business type
    const lowerType = businessType.toLowerCase();
    for (const [key, tags] of Object.entries(typeMap)) {
      if (lowerType.includes(key)) {
        return tags;
      }
    }

    // Default to general business tags
    return ['office=*', 'shop=*', 'amenity=*'];
  }



  private parseOverpassResults(data: any, centerCoords: { lat: number; lng: number }): RealBusiness[] {
    if (!data.elements || !Array.isArray(data.elements)) {
      return [];
    }

    return data.elements
      .filter((element: any) => element.tags && element.tags.name)
      .slice(0, 80) // High-density reconnaissance depth (increased from 10)
      .map((element: any) => {
        const tags = element.tags;
        const coords = { lat: element.lat, lng: element.lon };
        
        return {
          name: tags.name || 'Unknown Business',
          address: this.buildAddress(tags),
          phone: tags.phone || tags['contact:phone'],
          email: tags.email || tags['contact:email'],
          website: tags.website || tags['contact:website'],
          rating: this.parseRating(tags.rating),
          status: this.determineStatus(tags),
          distance: this.calculateDistance(centerCoords, coords),
          established: tags.start_date || tags.opening_date,
          category: this.getCategory(tags),
          coordinates: coords
        } as RealBusiness;
      });
  }

  private buildAddress(tags: any): string {
    const parts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:state'],
      tags['addr:country']
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  private parseRating(rating: string): number | undefined {
    if (!rating) return undefined;
    const parsed = parseFloat(rating);
    return isNaN(parsed) ? undefined : Math.min(5, Math.max(1, parsed));
  }

  private determineStatus(tags: any): 'active' | 'closed' | 'unknown' {
    if (tags.disused === 'yes' || tags.abandoned === 'yes') return 'closed';
    if (tags.opening_hours === '24/7' || tags.opening_hours) return 'active';
    return 'unknown';
  }

  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): string {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLon = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return `${distance.toFixed(1)} km`;
  }

  private getCategory(tags: any): string {
    if (tags.amenity) return tags.amenity;
    if (tags.shop) return `shop: ${tags.shop}`;
    if (tags.office) return `office: ${tags.office}`;
    if (tags.tourism) return `tourism: ${tags.tourism}`;
    return 'business';
  }
  private async searchAlternativeSources(params: BusinessSearchParams): Promise<RealBusiness[]> {
    // Fallback to location-based realistic data generation
    const { businessType, location, coordinates } = params;
    
    try {
      // Use Nominatim API to get more location details
      const locationDetails = await this.getLocationDetails(coordinates);
      
      // Generate realistic businesses based on actual location data
      return this.generateRealisticBusinesses(businessType, location, locationDetails, coordinates);
    } catch (error) {
      console.error('Alternative search failed:', error);
      return [];
    }
  }

  private async getLocationDetails(coordinates?: { lat: number; lng: number }) {
    if (!coordinates) return null;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=14&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BusinessAnalysisApp/1.0'
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Nominatim API error:', error);
      return null;
    }
  }

  private async generateRealisticBusinesses(
    businessType: string, 
    location: string, 
    locationDetails: any,
    coordinates?: { lat: number; lng: number }
  ): Promise<RealBusiness[]> {
    console.log(`📡 Zero Fallback Policy: Skipping synthetic generation for ${location}.`);
    return [];
  }
}

export const realBusinessAPI = new RealBusinessAPI();
export type { RealBusiness, BusinessSearchParams };