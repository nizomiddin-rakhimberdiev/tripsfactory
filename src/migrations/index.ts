import * as migration_20260804_155259_initial from './20260804_155259_initial';
import * as migration_20260811_135850_add_excursions from './20260811_135850_add_excursions';
import * as migration_20260811_154856_add_masterclasses from './20260811_154856_add_masterclasses';

export const migrations = [
  {
    up: migration_20260804_155259_initial.up,
    down: migration_20260804_155259_initial.down,
    name: '20260804_155259_initial',
  },
  {
    up: migration_20260811_135850_add_excursions.up,
    down: migration_20260811_135850_add_excursions.down,
    name: '20260811_135850_add_excursions',
  },
  {
    up: migration_20260811_154856_add_masterclasses.up,
    down: migration_20260811_154856_add_masterclasses.down,
    name: '20260811_154856_add_masterclasses'
  },
];
