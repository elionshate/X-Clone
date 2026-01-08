import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    const dbPath = path.resolve(__dirname, '..', 'dev.db');
    const dbExists = fs.existsSync(dbPath);
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: dbExists,
        path: dbPath,
      },
      uptime: process.uptime(),
    };
  }

  async getGeolocation(request: Request) {
    // Get client IP from various headers (handles proxies)
    const forwarded = request.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
      : request.ip || request.socket.remoteAddress || '';
    
    // Clean up IPv6 localhost
    const cleanIp = ip === '::1' || ip === '127.0.0.1' ? '' : ip;

    try {
      // Try ipwho.is first (no API key needed, CORS-friendly)
      const response = await fetch(`https://ipwho.is/${cleanIp || ''}`);
      const data = await response.json();
      
      if (data.success !== false) {
        return {
          countryCode: data.country_code || 'US',
          countryName: data.country || 'United States',
          city: data.city || null,
          region: data.region || null,
          ip: cleanIp || 'localhost',
        };
      }
    } catch (error) {
      console.error('ipwho.is failed:', error);
    }

    try {
      // Fallback to ip-api.com
      const response = await fetch(`http://ip-api.com/json/${cleanIp || ''}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          countryCode: data.countryCode || 'US',
          countryName: data.country || 'United States',
          city: data.city || null,
          region: data.regionName || null,
          ip: cleanIp || 'localhost',
        };
      }
    } catch (error) {
      console.error('ip-api.com failed:', error);
    }

    // Default fallback
    return {
      countryCode: 'US',
      countryName: 'United States',
      city: null,
      region: null,
      ip: cleanIp || 'localhost',
    };
  }
}
