import * as migration_20260804_155259_initial from './20260804_155259_initial';
import * as migration_20260811_135850_add_excursions from './20260811_135850_add_excursions';

export const migrations = [
  {
    up: migration_20260804_155259_initial.up,
    down: migration_20260804_155259_initial.down,
    name: '20260804_155259_initial',
  },
  {
    up: migration_20260811_135850_add_excursions.up,
    down: migration_20260811_135850_add_excursions.down,
    name: '20260811_135850_add_excursions'
  },
];
