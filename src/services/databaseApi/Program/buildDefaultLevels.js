import { defaultLevelNames } from '../../../constants/enums.js';

// Adults get A1 → C1 (with B1+), children Bounce 1 → 6, unless the program sends its own.
const buildDefaultLevels = (audience, fee = 0) =>
  defaultLevelNames(audience).map((name, i) => ({ number: i + 1, name, durationWeeks: audience === 'children' ? 10 : 12, hours: audience === 'children' ? 30 : 36, fee }));

export default buildDefaultLevels;
