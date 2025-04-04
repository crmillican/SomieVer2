import axios from 'axios';

export interface GeoLocationData {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // latitude,longitude
  postal?: string;
  timezone?: string;
}

/**
 * Service for handling geolocation-related operations
 */
export class GeolocationService {
  /**
   * Get geolocation data from user's IP address using ipinfo.io
   * Free tier allows 50,000 requests per month
   * 
   * @param ip Optional IP address (if not provided, the request IP is used)
   * @returns Geolocation data or null if there was an error
   */
  async getLocationFromIp(ip?: string): Promise<GeoLocationData | null> {
    try {
      // For production, you would want to use an API token
      // const token = process.env.IPINFO_TOKEN;
      const endpoint = ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json';
      
      const response = await axios.get(endpoint, {
        headers: {
          'Accept': 'application/json'
        },
        timeout: 5000 // 5 seconds timeout
      });
      
      if (response.status === 200) {
        return response.data as GeoLocationData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching geolocation data:', error);
      return null;
    }
  }
  
  /**
   * Get approximate coordinates from geolocation data
   * 
   * @param data Geolocation data
   * @returns Coordinates as [latitude, longitude] or null
   */
  getCoordinates(data: GeoLocationData): [number, number] | null {
    if (!data.loc) return null;
    
    const [latitude, longitude] = data.loc.split(',').map(Number);
    if (isNaN(latitude) || isNaN(longitude)) return null;
    
    return [latitude, longitude];
  }
}

export const geolocationService = new GeolocationService();