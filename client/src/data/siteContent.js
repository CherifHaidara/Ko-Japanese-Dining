export const RESTAURANT_INFO = {
  name: 'Ko Japanese Dining',
  addressLine1: '1610 20th St NW, 2nd Floor',
  cityStateZip: 'Washington, DC 20009',
  phoneDisplay: '+1 (771) 772-3358',
  phoneHref: 'tel:+17717723358',
  email: 'ko@kojapanesedining.com',
  mapEmbedUrl: 'https://maps.google.com/maps?q=1610%2020th%20St%20NW%2C%202nd%20Floor%2C%20Washington%2C%20DC%2020009&z=15&output=embed',
  mapDirectionsUrl: 'https://www.google.com/maps/search/?api=1&query=1610+20th+St+NW+2nd+Floor+Washington+DC+20009',
};

export const WEEKLY_HOURS = [
  { day: 'Monday', hours: 'Closed' },
  { day: 'Tuesday', hours: '11:30 AM - 3 PM, 5 PM - 9 PM' },
  { day: 'Wednesday', hours: '11:30 AM - 3 PM, 5 PM - 9 PM' },
  { day: 'Thursday', hours: '11:30 AM - 3 PM, 5 PM - 9 PM' },
  { day: 'Friday', hours: '11:30 AM - 3 PM, 5 PM - 10 PM' },
  { day: 'Saturday', hours: '11:30 AM - 10 PM' },
  { day: 'Sunday', hours: '11:30 AM - 9 PM' },
];

export const HOLIDAY_HOURS = [
  {
    title: 'Holiday Service',
    description: 'Holiday and special-event hours may shift based on omakase, kaiseki, and private event bookings. We recommend checking ahead for major weekends.',
  },
  {
    title: 'Large Party Planning',
    description: 'For private dining, celebrations, or chef-led experiences, contact the team in advance so service timing and menu pacing can be tailored to your group.',
  },
];

export const PARKING_DETAILS = [
  'Street parking is available around Dupont Circle, with peak demand during dinner service.',
  'The restaurant is a short walk from Dupont Circle Metro, making rideshare and public transit strong options for evening visits.',
  'Please allow a few extra minutes for building access since Ko is located on the second floor.',
];

export const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61559905862010',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/kojapanesedining/',
  },
];

export const PRIMARY_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/japanese-menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/hours-location', label: 'Hours & Location' },
  { to: '/reservations', label: 'Reserve' },
  { to: '/contact', label: 'Contact' },
];

export const FOOTER_NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/japanese-menu', label: 'Menu' },
  { to: '/about', label: 'About Us' },
  { to: '/hours-location', label: 'Hours & Location' },
  { to: '/contact', label: 'Contact' },
];

export const ABOUT_STORY_SECTIONS = [
  {
    title: 'Restaurant Story',
    body: 'Ko Japanese Dining is a family-owned restaurant in Dupont Circle, created to share the warmth, hospitality, and craft of traditional Japanese dining in Washington, DC.',
  },
  {
    title: 'Chef Background',
    body: 'The kitchen is led by a Japanese chef whose approach centers on precision, seasonality, and the kind of comfort dishes that feel personal as well as polished.',
  },
  {
    title: 'Cuisine Philosophy',
    body: 'Every plate aims to balance authenticity with hospitality, from carefully prepared sashimi and nigiri to home-style favorites that turn an evening out into a full cultural experience.',
  },
];

export const ABOUT_PHOTOS = [
  {
    src: '/images/KoJapaneseParallaxBackground.jpg',
    alt: 'Ko Japanese Dining dining room',
    caption: 'A warm dining room designed for intimate dinners and quiet celebrations.',
  },
  {
    src: '/images/StolenBarImage.jpg',
    alt: 'Ko Japanese Dining bar ambience',
    caption: 'A moody bar setting that carries the same calm, curated feel as the dining room.',
  },
  {
    src: '/images/SabaiParallaxBackground.png',
    alt: 'Ko Japanese Dining hospitality atmosphere',
    caption: 'An atmosphere shaped around hospitality, pacing, and a sense of occasion.',
  },
];

export const HOME_HIGHLIGHTS = [
  {
    title: 'Chef-led tasting experiences',
    description: 'Kaiseki and omakase dinners bring a more ceremonial rhythm to the evening, with each course paced intentionally.',
  },
  {
    title: 'Comfort dishes with craft',
    description: 'From karaage and katsu to sashimi and nigiri, the menu balances everyday favorites with formal Japanese technique.',
  },
  {
    title: 'Dupont Circle setting',
    description: 'An intimate second-floor dining room gives Ko a tucked-away feel while staying easy to reach for lunch, dinner, and celebrations.',
  },
];

export const MENU_PREVIEW_ITEMS = [
  { name: 'Karaage', image: '/images/menu/karaage.png' },
  { name: 'Tonkatsu', image: '/images/menu/tonkatsu.png' },
  { name: 'Spicy Tuna Roll', image: '/images/menu/spicy-tuna-roll.png' },
  { name: 'Mochi Ice Cream', image: '/images/menu/mochi-ice-cream.png' },
];

export const DIETARY_FILTER_TAGS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy', 'Raw Fish'];
