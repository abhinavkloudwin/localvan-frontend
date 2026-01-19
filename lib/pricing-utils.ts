/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate booking amount based on vehicle type pricing and distance
 */
export function calculateBookingAmount(
  vehicleTypePricing: {
    base_km: number;
    base_fare_ac: number;
    base_fare_non_ac: number;
    per_km_charge_ac: number;
    per_km_charge_non_ac: number;
  },
  distanceKm: number,
  isAc: boolean = true
): {
  baseAmount: number;
  extraKm: number;
  extraKmCharge: number;
  totalAmount: number;
  distanceKm: number;
} {
  const baseFare = isAc ? vehicleTypePricing.base_fare_ac : vehicleTypePricing.base_fare_non_ac;
  const perKmCharge = isAc ? vehicleTypePricing.per_km_charge_ac : vehicleTypePricing.per_km_charge_non_ac;

  // Calculate extra kilometers beyond base_km
  const extraKm = Math.max(0, distanceKm - vehicleTypePricing.base_km);
  const extraKmCharge = extraKm * perKmCharge;
  const totalAmount = baseFare + extraKmCharge;

  return {
    baseAmount: baseFare,
    extraKm,
    extraKmCharge,
    totalAmount,
    distanceKm,
  };
}
