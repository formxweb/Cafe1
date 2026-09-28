// Business facts used across the site. Everything here is verified:
// phone and Instagram come from the owner's brief; address, hours and the
// pre-order window come from the settings of the current menu app
// (lajoiemersin.com.tr). Do not add anything that has not been confirmed.

export const site = {
  name: 'La Joie',
  fullName: 'La Joie Kitchen & Coffee',
  descriptor: 'Kitchen & Coffee',
  url: 'https://www.lajoiemersin.com.tr',
  locale: 'tr_TR',

  phone: {
    display: '0540 013 32 33',
    href: 'tel:+905400133233',
    e164: '+905400133233',
  },

  instagram: {
    handle: 'lajoiecoffee',
    url: 'https://www.instagram.com/lajoiecoffee/',
  },

  address: {
    street: 'Dershaneler Sokağı',
    city: 'Mersin',
    country: 'TR',
  },

  // Only the street is verified, so directions open a Maps search for it.
  // Replace with the exact Google Maps place link once it is confirmed.
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('La Joie, Dershaneler Sokağı, Mersin'),

  // Every day, 09:00–22:00 (Europe/Istanbul).
  hours: { open: '09:00', close: '22:00', label: 'Her gün 09:00 – 22:00' },
  timeZone: 'Europe/Istanbul',

  // Lunch pre-order in the existing menu app: pay at the counter.
  preorder: {
    url: 'https://www.lajoiemersin.com.tr/',
    from: '11:30',
    until: '19:30',
    note: 'Ödeme kasada',
  },
};

// Public, read-only endpoint the existing menu app already uses. The site
// reads current prices from it at runtime so a printed price never goes stale.
export const liveMenu = {
  enabled: true,
  url: 'https://swqyokzctjxmxewnkxje.supabase.co',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3cXlva3pjdGp4bXhld25reGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTA0ODksImV4cCI6MjEwMDgyNjQ4OX0.1QehhlVsCK7cHbBFGrJPtnQtXAQMBBLKqKf45QqKeTo',
};

// Chapters of the page, in order. Used by the navigation and the footer.
export const sections = [
  { href: '#masa', label: 'Masa' },
  { href: '#menu', label: 'Menü' },
  { href: '#gun', label: 'Gün' },
  { href: '#instagram', label: 'Instagram' },
  { href: '#ziyaret', label: 'Ziyaret' },
];
