import { getApiUrl } from "@/config/api";

// Country State City API Integration
const API_KEY = '2f0d244021227aff82ad8164aad0f2bf0d1eaa3a289b111307fbaeee16436922';
const BASE_URL = 'https://api.countrystatecity.in/v1';

interface Country {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  numeric_code: string;
  phone_code: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  region: string;
  subregion: string;
  timezones: Array<{
    zoneName: string;
    gmtOffset: number;
    gmtOffsetName: string;
    abbreviation: string;
    tzName: string;
  }>;
  translations: Record<string, string>;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
}

interface State {
  id: number;
  name: string;
  country_code: string;
  country_name: string;
  state_code: string;
  type: string;
  latitude: string;
  longitude: string;
}

interface City {
  id: number;
  name: string;
  state_code: string;
  state_name: string;
  country_code: string;
  country_name: string;
  latitude: string;
  longitude: string;
  wikiDataId: string;
}

class LocationAPI {
  private headers = {
    'X-CSCAPI-KEY': API_KEY,
    'Content-Type': 'application/json'
  };

  async detectUserLocation(): Promise<{ city: string; country: string; countryCode: string } | null> {
    try {
      // 1. Try our own backend proxy first (solves CORS and rate limits)
      const apiUrl = getApiUrl();
      const proxyRes = await fetch(`${apiUrl}/api/system/location`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        console.log('🌍 Detected location via Proxy:', data);
        return {
          city: data.city || 'Unknown',
          country: data.country || 'Unknown',
          countryCode: data.country_code || 'IN'
        };
      }
    } catch (e) {
      console.warn('Backend location proxy failed, trying fallbacks...');
    }

    try {
      // 2. Fallback to direct lookups if proxy fails
      const apis = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://api.bigdatacloud.net/data/reverse-geocode-client'
      ];

      for (const api of apis) {
        try {
          const res = await fetch(api, { timeout: 3000 } as any);
          if (res.ok) {
            const data = await res.json();
            console.log('🌍 Detected location:', data);
            return {
              city: data.city || data.cityName || 'Unknown',
              country: data.country_name || data.countryName || 'Unknown',
              countryCode: data.country_code || data.countryCode || 'IN'
            };
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Error detecting location:', error);
      return null;
    }
  }

  async getAllCountries(): Promise<Country[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  async getCountryByCode(countryCode: string): Promise<Country | null> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching country:', error);
      return null;
    }
  }

  async getStatesByCountry(countryCode: string): Promise<State[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}/states`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  async getCitiesByCountryAndState(countryCode: string, stateCode: string): Promise<City[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  async getCitiesByCountry(countryCode: string): Promise<City[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}/cities`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  // Helper method to parse location string and get geographical data
  async parseLocationString(
    locationString: string, 
    providedCoordinates?: { lat: number; lng: number }
  ): Promise<{
    country?: Country;
    state?: State;
    city?: City;
    coordinates?: { lat: number; lng: number };
  }> {
    try {
      console.log('🔍 Parsing location string:', locationString);
      
      // 1. TRY BACKEND AI RESOLVER FIRST (Source Research + Gemini)
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/system/resolve-location?q=${encodeURIComponent(locationString)}`);
        
        if (response.ok) {
          const res = await response.json();
          if (res.success && res.data) {
            console.log('✅ Resolved via Backend AI:', res.data);
            const data = res.data;
            
            // Map the flat backend structure to the expected frontend structure
            return {
              country: { name: data.country, iso2: data.country_code, emoji: data.country_code === 'IN' ? '🇮🇳' : '' } as any,
              state: { name: data.state } as any,
              city: { name: data.city } as any,
              coordinates: data.coordinates
            };
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend location resolution failed, trying local logic...', backendError);
      }

      // 2. DEFAULT LOCAL LOGIC
      // Clean and split the location string
      const parts = locationString.split(',').map(part => part.trim().toLowerCase());
      console.log('📍 Location parts:', parts);
      
      // Get all countries to find a match
      const countries = await this.getAllCountries();
      let matchedCountry: Country | undefined;
      
      // First, try to find explicit country mentions with higher precision
      for (const country of countries) {
        const countryName = country.name.toLowerCase();
        const iso2 = country.iso2.toLowerCase();
        const iso3 = country.iso3.toLowerCase();
        
        // Use regex for word boundaries to avoid 'India' matching 'British Indian Ocean Territory'
        const isMatch = parts.some(part => {
          if (part === iso2 || part === iso3 || part === countryName) return true;
          if (part.length < 4) return false;
          
          // Word boundary check for full country names
          const regex = new RegExp(`\\b${part}\\b`, 'i');
          return regex.test(countryName);
        });

        if (isMatch) {
          matchedCountry = country;
          console.log('🌍 Found country match:', country.name);
          break;
        }
      }
      
      // If no explicit country found, try to infer from city/state names
      if (!matchedCountry) {
        console.log('🔍 No explicit country found, trying to infer...');
        
        // Check for common patterns
        const patterns = [
          { iso: 'IN', cities: ['bhopal', 'mumbai', 'delhi', 'bangalore'], states: ['madhya pradesh', 'maharashtra'] },
          { iso: 'US', cities: ['new york', 'los angeles', 'chicago'], states: ['california', 'texas'] },
          { iso: 'KR', cities: ['seoul', 'jongno', 'busan', 'incheon'], states: ['gyeonggi'] },
          { iso: 'GB', cities: ['london', 'manchester'], states: ['england'] }
        ];

        for (const pattern of patterns) {
          if (parts.some(part => 
            pattern.cities.some(city => part.includes(city) || city.includes(part)) ||
            pattern.states.some(state => part.includes(state) || state.includes(part))
          )) {
            matchedCountry = countries.find(c => c.iso2 === pattern.iso);
            if (matchedCountry) {
              console.log(`🌍 Inferred ${pattern.iso} from pattern`);
              break;
            }
          }
        }
        
        // Final fallback: Use detected user country if available, else India
        if (!matchedCountry) {
          const detected = await this.detectUserLocation();
          matchedCountry = countries.find(c => c.iso2 === (detected?.countryCode || 'IN'));
          console.log('🌍 Using smart fallback country:', matchedCountry?.name);
        }
      }
      
      let matchedState: State | undefined;
      let matchedCity: City | undefined;
      
      if (matchedCountry) {
        console.log('🔍 Searching in country:', matchedCountry.name);
        
        // Get states for the matched country
        const states = await this.getStatesByCountry(matchedCountry.iso2);
        console.log('📍 Found states:', states.length);
        
        // Look for state match with prioritization (Exact > Substring > Fuzzy)
        matchedState = states.find(s => parts.some(p => s.name.toLowerCase() === p)) || 
                       states.find(s => parts.some(p => s.name.toLowerCase().includes(p) || p.includes(s.name.toLowerCase()))) ||
                       states.find(s => parts.some(p => this.fuzzyMatch(p, s.name.toLowerCase(), 0.85)));
        
        if (matchedState) {
          console.log('🏛️ Found state match:', matchedState.name);
        }
        
        // Get cities
        let cities: City[] = [];
        if (matchedState) {
          cities = await this.getCitiesByCountryAndState(matchedCountry.iso2, matchedState.state_code);
        } else {
          // Get all cities in country if no state match
          cities = await this.getCitiesByCountry(matchedCountry.iso2);
        }
        
        console.log('🏙️ Found cities:', cities.length);
        
        // Look for city match with prioritization (Exact > Substring > Fuzzy)
        matchedCity = cities.find(c => parts.some(p => c.name.toLowerCase() === p)) ||
                      cities.find(c => parts.some(p => c.name.toLowerCase().includes(p) || p.includes(c.name.toLowerCase()))) ||
                      cities.find(c => parts.some(p => this.fuzzyMatch(p, c.name.toLowerCase(), 0.85)));
        
        // ─── OFFLINE CITY FALLBACK ─────────────────────────────────────────
        // The countrystatecity.in API returns 0 cities for many Indian states.
        // Use a curated local table so the UI always shows the correct city.
        if (!matchedCity) {
          matchedCity = this.getCityFromOfflineTable(parts, matchedCountry.iso2, matchedState?.state_code);
          if (matchedCity) console.log('🏙️ City resolved from offline table:', matchedCity.name);
        }
        // ──────────────────────────────────────────────────────────────────

        if (matchedCity) {
          console.log('🏙️ Found city match:', matchedCity.name);
        }
      }

      
      // Get coordinates from the most specific location available
      let coordinates: { lat: number; lng: number } | undefined;
      // COORDINATE CASCADE: Known Location > City > State > Country
      if (locationString) {
        const knownCoords = this.getKnownLocationCoordinates(locationString);
        if (knownCoords) {
          coordinates = knownCoords;
          console.log('📍 Using premium known location coordinates:', coordinates);
        }
      }

      if (!coordinates && matchedCity && matchedCity.latitude && matchedCity.longitude) {
        coordinates = {
          lat: parseFloat(matchedCity.latitude),
          lng: parseFloat(matchedCity.longitude)
        };
        console.log('📍 Using city-level coordinates:', coordinates);
      }

      if (!coordinates && matchedState && matchedState.latitude && matchedState.longitude) {
        coordinates = {
          lat: parseFloat(matchedState.latitude),
          lng: parseFloat(matchedState.longitude)
        };
        console.log('📍 Using state-level coordinates:', coordinates);
      }

      if (!coordinates && matchedCountry && matchedCountry.latitude && matchedCountry.longitude) {
        coordinates = {
          lat: parseFloat(matchedCountry.latitude),
          lng: parseFloat(matchedCountry.longitude)
        };
        console.log('📍 Using country-level coordinates:', coordinates);
      }
      
      if (!coordinates && providedCoordinates) {
        coordinates = providedCoordinates;
        console.log('📍 Using provided coordinates:', coordinates);
      }
      
      const result = {
        country: matchedCountry,
        state: matchedState,
        city: matchedCity,
        coordinates
      };
      
      console.log('✅ Final location result:', {
        country: result.country?.name,
        state: result.state?.name,
        city: result.city?.name,
        coordinates: result.coordinates
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error parsing location string:', error);
      return {};
    }
  }

  // Fuzzy matching helper
  private fuzzyMatch(str1: string, str2: string, threshold: number = 0.7): boolean {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return true;
    
    const distance = this.levenshteinDistance(longer, shorter);
    const similarity = (longer.length - distance) / longer.length;
    
    return similarity >= threshold;
  }

  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /** Offline city table — fallback when countrystatecity.in returns 0 cities */
  private getCityFromOfflineTable(parts: string[], countryIso2: string, stateCode?: string): City | undefined {
    type OfflineCity = { name: string; state_code: string; country_code: string; lat: string; lng: string };
    const CITIES: OfflineCity[] = [
      // ── Madhya Pradesh, India ──
      { name: 'Bhopal',       state_code: 'MP', country_code: 'IN', lat: '23.2599', lng: '77.4126' },
      { name: 'Indore',       state_code: 'MP', country_code: 'IN', lat: '22.7196', lng: '75.8577' },
      { name: 'Gwalior',      state_code: 'MP', country_code: 'IN', lat: '26.2183', lng: '78.1828' },
      { name: 'Jabalpur',     state_code: 'MP', country_code: 'IN', lat: '23.1815', lng: '79.9864' },
      { name: 'Ujjain',       state_code: 'MP', country_code: 'IN', lat: '23.1793', lng: '75.7849' },
      // ── Rajasthan ──
      { name: 'Jaipur',       state_code: 'RJ', country_code: 'IN', lat: '26.9124', lng: '75.7873' },
      { name: 'Jodhpur',      state_code: 'RJ', country_code: 'IN', lat: '26.2389', lng: '73.0243' },
      { name: 'Udaipur',      state_code: 'RJ', country_code: 'IN', lat: '24.5854', lng: '73.7125' },
      // ── Maharashtra ──
      { name: 'Mumbai',       state_code: 'MH', country_code: 'IN', lat: '19.0760', lng: '72.8777' },
      { name: 'Pune',         state_code: 'MH', country_code: 'IN', lat: '18.5204', lng: '73.8567' },
      { name: 'Nagpur',       state_code: 'MH', country_code: 'IN', lat: '21.1458', lng: '79.0882' },
      { name: 'Aurangabad',   state_code: 'MH', country_code: 'IN', lat: '19.8762', lng: '75.3433' },
      // ── Uttar Pradesh ──
      { name: 'Lucknow',      state_code: 'UP', country_code: 'IN', lat: '26.8467', lng: '80.9462' },
      { name: 'Kanpur',       state_code: 'UP', country_code: 'IN', lat: '26.4499', lng: '80.3319' },
      { name: 'Agra',         state_code: 'UP', country_code: 'IN', lat: '27.1767', lng: '78.0081' },
      { name: 'Varanasi',     state_code: 'UP', country_code: 'IN', lat: '25.3176', lng: '82.9739' },
      // ── Karnataka ──
      { name: 'Bangalore',    state_code: 'KA', country_code: 'IN', lat: '12.9716', lng: '77.5946' },
      { name: 'Mysore',       state_code: 'KA', country_code: 'IN', lat: '12.2958', lng: '76.6394' },
      // ── Tamil Nadu ──
      { name: 'Chennai',      state_code: 'TN', country_code: 'IN', lat: '13.0827', lng: '80.2707' },
      { name: 'Coimbatore',   state_code: 'TN', country_code: 'IN', lat: '11.0168', lng: '76.9558' },
      // ── West Bengal ──
      { name: 'Kolkata',      state_code: 'WB', country_code: 'IN', lat: '22.5726', lng: '88.3639' },
      // ── Delhi ──
      { name: 'New Delhi',    state_code: 'DL', country_code: 'IN', lat: '28.6139', lng: '77.2090' },
      { name: 'Delhi',        state_code: 'DL', country_code: 'IN', lat: '28.7041', lng: '77.1025' },
      // ── Gujarat ──
      { name: 'Ahmedabad',    state_code: 'GJ', country_code: 'IN', lat: '23.0225', lng: '72.5714' },
      { name: 'Surat',        state_code: 'GJ', country_code: 'IN', lat: '21.1702', lng: '72.8311' },
      // ── Telangana ──
      { name: 'Hyderabad',    state_code: 'TS', country_code: 'IN', lat: '17.3850', lng: '78.4867' },
      // ── International ──
      { name: 'New York',     state_code: 'NY', country_code: 'US', lat: '40.7128', lng: '-74.0060' },
      { name: 'Los Angeles',  state_code: 'CA', country_code: 'US', lat: '34.0522', lng: '-118.2437' },
      { name: 'Chicago',      state_code: 'IL', country_code: 'US', lat: '41.8781', lng: '-87.6298' },
      { name: 'London',       state_code: 'ENG', country_code: 'GB', lat: '51.5074', lng: '-0.1278' },
      { name: 'Tokyo',        state_code: '13', country_code: 'JP', lat: '35.6762', lng: '139.6503' },
      { name: 'Sydney',       state_code: 'NSW', country_code: 'AU', lat: '-33.8688', lng: '151.2093' },
      { name: 'Dubai',        state_code: 'DU', country_code: 'AE', lat: '25.2048', lng: '55.2708' },
      { name: 'Singapore',    state_code: 'SG', country_code: 'SG', lat: '1.3521', lng: '103.8198' },
    ];

    const filtered = CITIES.filter(c =>
      c.country_code === countryIso2 &&
      (!stateCode || c.state_code === stateCode) &&
      parts.some(p => c.name.toLowerCase() === p || c.name.toLowerCase().includes(p) || p.includes(c.name.toLowerCase()))
    );

    if (!filtered.length) return undefined;

    const match = filtered[0];
    return {
      id: 0,
      name: match.name,
      state_code: match.state_code,
      state_name: '',
      country_code: match.country_code,
      country_name: '',
      latitude: match.lat,
      longitude: match.lng,
      wikiDataId: ''
    };
  }

  // Known location coordinates for manual lookup
  private getKnownLocationCoordinates(locationString: string): { lat: number; lng: number } | undefined {
    const knownLocations: Record<string, { lat: number; lng: number }> = {
      'berasia': { lat: 23.6345, lng: 77.4365 },
      'berasia, india': { lat: 23.6345, lng: 77.4365 },
      'berasia, madhya pradesh': { lat: 23.6345, lng: 77.4365 },
      'berasia, mp': { lat: 23.6345, lng: 77.4365 },
      'american samoa': { lat: -14.2710, lng: -170.1322 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.7041, lng: 77.1025 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'bhopal': { lat: 23.2599, lng: 77.4126 }
    };

    const key = locationString.toLowerCase().trim();
    return knownLocations[key] || 
           knownLocations[key.split(',')[0].trim()] ||
           Object.entries(knownLocations).find(([k]) => 
             k.includes(key.split(',')[0].trim()) || 
             key.includes(k)
           )?.[1];
  }

  // Generate realistic business data based on location
  generateLocationBasedBusinessData(locationData: {
    country?: Country;
    state?: State;
    city?: City;
    coordinates?: { lat: number; lng: number };
  }, businessType: string) {
    const { country, state, city } = locationData;
    const locationName = city?.name || state?.name || country?.name || 'Unknown Location';
    const countryName = country?.name || 'Unknown Country';
    
    // Generate realistic business names based on location and type
    const businessNames = [
      `${locationName} ${businessType.split(' ')[0]} Solutions`,
      `${businessType.split(' ')[0]} Hub ${locationName}`,
      `Elite ${businessType.split(' ')[0]} ${locationName}`,
      `${locationName} Premium ${businessType.split(' ')[0]}`,
      `Local ${businessType.split(' ')[0]} Network`,
      `${businessType.split(' ')[0]} Express ${locationName}`,
      `${locationName} Professional ${businessType.split(' ')[0]}`,
      `Quality ${businessType.split(' ')[0]} ${locationName}`
    ];
    
    // Generate contact information based on country
    const phoneFormats = {
      'United States': '+1 (555) XXX-XXXX',
      'India': '+91 XXXXX XXXXX',
      'United Kingdom': '+44 XXXX XXXXXX',
      'Canada': '+1 (XXX) XXX-XXXX',
      'Australia': '+61 X XXXX XXXX',
      'Germany': '+49 XXX XXXXXXX',
      'France': '+33 X XX XX XX XX',
      'default': '+XX XXX XXX XXXX'
    };
    
    const phoneFormat = phoneFormats[countryName as keyof typeof phoneFormats] || phoneFormats.default;
    
    return {
      locationName,
      countryName,
      businessNames,
      phoneFormat,
      currency: country?.currency_symbol || '$',
      timezone: country?.timezones?.[0]?.tzName || 'UTC',
      coordinates: locationData.coordinates
    };
  }
}

export const locationAPI = new LocationAPI();
export type { Country, State, City };