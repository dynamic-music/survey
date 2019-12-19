import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

const WEATHER_KEY = "3d77879a046ee9e970e66bb2f5c5200d";
const API_URL = `https://api.openweathermap.org/data/2.5/weather?appid=${WEATHER_KEY}`;

interface WeatherObject {
  id: number, //800
  main: string, //"Clear"
  description: string, //"clear sky",
  icon: string //"01d"
}

@Injectable()
export class WeatherService {

  constructor(private http: Http) {}

  async getWeatherNearby(lat: number, long: number): Promise<WeatherObject> {
    const query = API_URL+"&lat="+lat+"&lon="+long;
    try {
      const json = (await this.http.get(query).toPromise()).json();
      return json["weather"][0];
    } catch (e) {
      console.error(e);
      return Promise.reject(e.message || e);
    }
  }

};