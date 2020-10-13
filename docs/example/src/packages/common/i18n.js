import {createInstance} from './i18next.js';

import de from './i18n/de/translation.json';
import en from './i18n/en/translation.json';

export const i18n = createInstance({en: en, de: de}, 'de', 'en');