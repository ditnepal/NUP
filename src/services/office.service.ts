import { BaseService } from './base.service';

export class OfficeService extends BaseService {
  async createOffice(data: {
    name: string;
    type: string;
    orgUnitId: string;
    address: string;
    contactNumber?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    isActive?: boolean;
    isPublic?: boolean;
    description?: string;
    province?: string;
    district?: string;
    locality?: string;
    ward?: number;
    municipality?: string;
  }) {
    return await this.db.office.create({
      data
    });
  }

  async updateOffice(id: string, data: Partial<{
    name: string;
    type: string;
    orgUnitId: string;
    address: string;
    contactNumber?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    isActive: boolean;
    isPublic: boolean;
    description?: string;
    province?: string;
    district?: string;
    locality?: string;
    ward?: number;
    municipality?: string;
  }>) {
    return await this.db.office.update({
      where: { id },
      data
    });
  }

  async getOfficesByUnit(unitId: string) {
    return await this.db.office.findMany({
      where: { orgUnitId: unitId, isActive: true },
      include: { orgUnit: true }
    });
  }

  /**
   * Public office finder
   */
  async findNearbyOffices(lat: number, lng: number, radiusKm: number = 50) {
    // Basic implementation for SQLite (no spatial index)
    // In production with PostGIS, we'd use ST_Distance
    const allOffices = await this.db.office.findMany({
      where: { isActive: true },
      include: { orgUnit: true }
    });

    return allOffices.filter(office => {
      if (!office.latitude || !office.longitude) return false;
      const dist = this.calculateDistance(lat, lng, office.latitude, office.longitude);
      return dist <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const officeService = new OfficeService();
