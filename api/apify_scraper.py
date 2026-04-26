import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Lazy import to avoid startup issues if not installed
def get_apify_client():
    from apify_client import ApifyClient
    api_key = os.getenv("APIFY_API_KEY")
    if not api_key:
        print("⚠️ APIFY_API_KEY not found in environment")
        return None
    return ApifyClient(api_key)
def scrape_google_maps_contacts(search_queries: List[str], location: Optional[str] = None, max_results: int = 20, scrape_reviews: bool = False, scrape_contacts: bool = True, lat: Optional[float] = None, lng: Optional[float] = None) -> List[Dict[str, Any]]:
    """
    Triggers the Apify google-maps-contact-extractor actor and returns high-fidelity results.
    """
    client = get_apify_client()
    if not client:
        return []
        
    # Pre-process search strings to ensure geographical context is explicitly embedded
    final_queries = []
    for q in search_queries:
        if location and location.lower() not in q.lower():
            final_queries.append(f"{q} in {location}")
        else:
            final_queries.append(q)

    run_input = {
        "searchStrings": final_queries,
        "locationDisplayName": location or "India",
        "locationQuery": location or "India",
        "maxResults": max_results,
        "maxCrawledPlaces": max_results,
        "exportPlaceUrls": True,
        "includeReviews": scrape_reviews,
        "includeImages": False,
        "includeOpeningHours": True,
        "scrapeWebsite": scrape_contacts,
        "language": "en",
        "zoom": 12,
        "maxParallelRequests": 20, # Accelerate scraping
        "decompress": True
    }
    
    # Explicit Geolocation: Manual fix for start coordinates if available
    if lat and lng:
        run_input["latitude"] = lat
        run_input["longitude"] = lng

    try:
        print(f"[RECONNAISSANCE] Spawning Apify actor for {len(final_queries)} target vectors...")
        # dpWePxnzRER4fPvM0 is the ID for google-maps-contact-extractor
        run = client.actor("dpWePxnzRER4fPvM0").call(run_input=run_input)
        
        results = []
        # Fetch results from the default dataset
        print(f"Fetching results from Apify dataset: {run['defaultDatasetId']}")
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            results.append(item)
            
        print(f"Successfully scraped {len(results)} high-fidelity business results.")
        return results
    except Exception as e:
        print(f"Apify Actor execution failed: {e}")
        return []


def format_apify_to_internal(apify_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map the raw Apify output to our internal RealBusiness schema.
    """
    # Attempt to calculate status
    is_closed = apify_item.get('isClosed', False)
    status = 'closed' if is_closed else ('active' if apify_item.get('openingHours') else 'unknown')
    
    return {
        "name": apify_item.get('title', 'Unknown Business'),
        "address": apify_item.get('address', 'N/A'),
        "phone": apify_item.get('phone', apify_item.get('internationalPhone')),
        "email": apify_item.get('email', apify_item.get('contactEmail')), # Scraped contacts
        "website": apify_item.get('website'),
        "rating": apify_item.get('totalScore'),
        "reviews": apify_item.get('reviewsCount'),
        "status": status,
        "category": apify_item.get('categoryName', 'Local Business'),
        "coordinates": {
            "lat": apify_item.get('location', {}).get('lat', 0),
            "lng": apify_item.get('location', {}).get('lng', 0)
        },
        "social_media": apify_item.get('socialMedia', []),
        "opening_hours": apify_item.get('openingHours', []),
        "price_level": apify_item.get('priceLevel'),
        "source": "apify-google-maps"
    }

if __name__ == "__main__":
    load_dotenv()
    # Test run
    test_results = scrape_google_maps_contacts(["electrician"], "Bhopal, MP, India", max_results=5)
    for res in test_results[:2]:
        print(json.dumps(format_apify_to_internal(res), indent=2))
