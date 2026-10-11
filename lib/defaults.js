// Pradinis svetainės turinys. Naudojamas, kol valdymo programėlėje dar niekas neišsaugota.
export const CATEGORIES = ['Treniruotės', 'Varžybos', 'Stovyklos', 'Renginiai', 'Laisvalaikis'];
export const SESSION_TYPES = ['kids', 'youth', 'women'];

export const DEFAULT_CONTENT = {
  version: 1,
  hero: {
    motto: ['Stipriname kūną.', 'Ugdome charakterį.'],
    description: ['Boksas vaikams ir jaunimui.', 'Fitboksas, kardio ir atletika moterims.', 'Asmeninės bokso treniruotės.'],
    season: '2026–2027 m. sezonas'
  },
  groups: [
    { age: '7–12 metų', title: 'Boksas vaikams', description: '1 bokso grupė. Bokso pagrindai, koordinacija ir fizinis pasirengimas.', hours: [{ label: 'Pirm. · Treč. · Penkt.', value: '18:00–19:00' }] },
    { age: 'Nuo 13 metų', title: 'Boksas jaunimui', description: '2 bokso ir varžybinė grupė. Technikos tobulinimas ir nuoseklus fizinis rengimas.', hours: [{ label: 'Pirm. · Treč. · Penkt.', value: '19:00–20:00' }] },
    { age: 'Moterims', title: 'Fitboksas ir atletika', description: 'Fitboksas, kardio ir atletika įvairaus pasirengimo moterims. Jėga, ištvermė ir koordinacija.', hours: [{ label: 'Antr. · Ketv.', value: '19:00–20:00' }, { label: 'Šeštadienį', value: '11:00–12:00' }] },
    { age: 'Individualiai', title: 'Asmeninės treniruotės', description: 'Asmeninės bokso treniruotės — individualus darbas su treneriu.', hours: [{ label: 'Dėl laiko ir registracijos', value: '' }] }
  ],
  schedule: {
    season: '2026–2027',
    place: 'Grigiškių gimnazija',
    address: 'Kovo 11-osios g. 21',
    note: 'Prieš pirmąją treniruotę susisiekite su klubu.',
    days: [
      { name: 'Pirmadienis', sessions: [
        { time: '18:00–19:00', title: 'Boksas vaikams', note: '7–12 metų', type: 'kids' },
        { time: '19:00–20:00', title: 'Boksas jaunimui', note: 'Nuo 13 metų · varžybinė grupė', type: 'youth' }] },
      { name: 'Antradienis', sessions: [
        { time: '19:00–20:00', title: 'Fitboksas ir atletika', note: 'Moterims', type: 'women' }] },
      { name: 'Trečiadienis', sessions: [
        { time: '18:00–19:00', title: 'Boksas vaikams', note: '7–12 metų', type: 'kids' },
        { time: '19:00–20:00', title: 'Boksas jaunimui', note: 'Nuo 13 metų · varžybinė grupė', type: 'youth' }] },
      { name: 'Ketvirtadienis', sessions: [
        { time: '19:00–20:00', title: 'Fitboksas ir atletika', note: 'Moterims', type: 'women' }] },
      { name: 'Penktadienis', sessions: [
        { time: '18:00–19:00', title: 'Boksas vaikams', note: '7–12 metų', type: 'kids' },
        { time: '19:00–20:00', title: 'Boksas jaunimui', note: 'Nuo 13 metų · varžybinė grupė', type: 'youth' }] },
      { name: 'Šeštadienis', sessions: [
        { time: '11:00–12:00', title: 'Fitboksas ir atletika', note: 'Moterims', type: 'women' }] }
    ]
  },
  about: {
    founded: '2011',
    paragraphs: [
      'Grigiškių bokso klubas įkurtas 2011 m. spalio 25 d. Klubo tikslai — fizinė sveikata, techninis meistriškumas, varžybų organizavimas, asmeninis tobulėjimas ir bendruomenės kūrimas.',
      'Grigiškių gimnazijoje vyksta bokso treniruotės vaikams ir jaunimui bei fitbokso, kardio ir atletikos treniruotės moterims.'
    ]
  },
  contacts: {
    phone: '+370 650 88899',
    email: 'grigiskiuboksoklubas@gmail.com',
    place: 'Grigiškių gimnazija',
    address: 'Kovo 11-osios g. 21, Grigiškės',
    facebook: 'https://www.facebook.com/boxing.skf',
    instagram: 'https://www.instagram.com/grigiskiu_bokso_klubas'
  },
  posters: {
    schedule: '/assets/schedule-2026-2027.jpg',
    fitboxing: '/assets/fitboxing-women.jpg'
  },
  gallery: [
    { id: 'g1', src: '/assets/galerija/varzybos-latvija-komanda.jpg', caption: 'Komanda su medaliais po tarptautinių varžybų Latvijoje', category: 'Varžybos' },
    { id: 'g2', src: '/assets/galerija/varzybos-latvija.jpg', caption: 'Pergalė atvirame bokso čempionate Latvijoje', category: 'Varžybos' },
    { id: 'g3', src: '/assets/galerija/varzybos-palanga.jpg', caption: 'Apdovanojimai Palangos sporto centre', category: 'Varžybos' },
    { id: 'g4', src: '/assets/galerija/varzybos-komanda.jpg', caption: 'Klubo boksininkai su treneriu prie ringo', category: 'Varžybos' },
    { id: 'g5', src: '/assets/galerija/varzybos-vilniaus-rajonas.jpg', caption: 'Vilniaus rajono jaunių bokso turnyras', category: 'Varžybos' },
    { id: 'g6', src: '/assets/galerija/varzybos-marijampole.jpg', caption: 'Medaliai ir diplomai Marijampolėje', category: 'Varžybos' },
    { id: 'g7', src: '/assets/galerija/varzybos-klaipeda-3.jpg', caption: 'Teisėjas skelbia pergalę', category: 'Varžybos' },
    { id: 'g8', src: '/assets/galerija/varzybos-klaipeda-1.jpg', caption: 'Lietuvos jaunučių čempionatas Klaipėdoje', category: 'Varžybos' },
    { id: 'g9', src: '/assets/galerija/varzybos-klaipeda-2.jpg', caption: 'Trys medaliai iš Klaipėdos', category: 'Varžybos' },
    { id: 'g10', src: '/assets/galerija/treniruote-sparingas.jpg', caption: 'Sparingai Grigiškių gimnazijos salėje', category: 'Treniruotės' },
    { id: 'g11', src: '/assets/galerija/treniruote-1.jpg', caption: 'Technikos treniruotė su treneriu', category: 'Treniruotės' },
    { id: 'g12', src: '/assets/galerija/treniruote-2.jpg', caption: 'Kojų darbas ir gynyba', category: 'Treniruotės' }
  ]
};
