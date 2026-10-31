import { Equipment } from './equipment';

// Source locale provisoire, isolée pour le futur raccordement à l'API métier.
export const DEMO_EQUIPMENT: readonly Equipment[] = [
  {
    id: 'EQ-OUT-0001',
    name: 'Tondeuse autoportée',
    location: 'Centre technique municipal',
    image: {
      src: '/images/demo/mower.webp',
      thumbnail: '/images/demo/mower-thumb.webp',
      alt: 'Illustration fictive : Tondeuse autoportée',
    },
  },
  {
    id: 'EQ-OUT-0002',
    name: 'Souffleur à feuilles',
    location: 'Remise du parc des Tilleuls',
    image: {
      src: '/images/demo/blower.webp',
      thumbnail: '/images/demo/blower-thumb.webp',
      alt: 'Illustration fictive : Souffleur à feuilles',
    },
  },
  {
    id: 'EQ-OUT-0003',
    name: 'Débroussailleuse n°3',
    location: 'Atelier municipal',
    image: {
      src: '/images/demo/brushcutter.webp',
      thumbnail: '/images/demo/brushcutter-thumb.webp',
      alt: 'Illustration fictive : Débroussailleuse n°3',
    },
  },
  {
    id: 'EQ-VEH-0042',
    name: 'Fourgon de voirie',
    location: 'Garage municipal',
    image: {
      src: '/images/demo/van.webp',
      thumbnail: '/images/demo/van-thumb.webp',
      alt: 'Illustration fictive : Fourgon de voirie',
    },
  },
  {
    id: 'EQ-BAT-0011',
    name: 'Chaudière du groupe scolaire',
    location: 'École des Marronniers',
    image: {
      src: '/images/demo/boiler.webp',
      thumbnail: '/images/demo/boiler-thumb.webp',
      alt: 'Illustration fictive : Chaudière du groupe scolaire',
    },
  },
  {
    id: 'EQ-OUT-0004',
    name: 'Nettoyeur haute pression',
    location: 'Local technique du gymnase',
    image: {
      src: '/images/demo/washer.webp',
      thumbnail: '/images/demo/washer-thumb.webp',
      alt: 'Illustration fictive : Nettoyeur haute pression',
    },
  },
];
