import { DEFAULT_LEVEL_COUNT } from '../../../constants/enums.js';

// Every workshop has 6 levels unless said otherwise.
const buildDefaultLevels = (count = DEFAULT_LEVEL_COUNT, fee = 0) =>
  Array.from({ length: count }, (_, i) => ({ number: i + 1, name: `Level ${i + 1}`, durationWeeks: 12, hours: 36, fee }));

export default buildDefaultLevels;
