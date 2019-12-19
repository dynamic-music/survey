import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

const API_URL = "https://overpass-api.de/api/interpreter?data=[out:json];";
const DELTA = 0.004;

interface OverpassObject {
  amenity?: string,
  nature?: string,
  highway?: string,
  railway?: string,
  shop?: string,
  place?: string,
  historic?: string
}

@Injectable()
export class OverpassService {

  constructor(private http: Http) {}

  async getObjectTagsNearby(lat: number, long: number): Promise<OverpassObject[]> {
    const bbox = [lat-DELTA, long-DELTA, lat+DELTA, long+DELTA];
    const query = API_URL+"node("+bbox.join(",")+");out;";
    try {
      const json = (await this.http.get(query).toPromise()).json();
      return json.elements.filter(b => b.tags).map(b => b.tags);
    } catch (e) {
      console.error(e);
      return Promise.reject(e.message || e);
    }
  }
  
  async getShopsAndAmenitiesNearby(lat: number, long: number): Promise<OverpassObject[]> {
    return (await this.getObjectTagsNearby(lat, long))
      .filter(o => o.amenity != null || o.shop != null);
  }

};