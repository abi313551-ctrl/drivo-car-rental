// Seed coupons. Stage 7 lets the admin manage them (stored in localStorage).
export const coupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, active: true, description: '10% off the rental' },
  { code: 'WEEKEND15', type: 'percent', value: 15, weekendOnly: true, active: true, description: '15% off for Friday or Saturday pickups' },
  { code: 'EVGO500', type: 'flat', value: 500, category: 'Electric', active: true, description: '₹500 off electric cars' },
];
