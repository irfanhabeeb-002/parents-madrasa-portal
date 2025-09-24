import { describe, it, expect } from 'vitest';
import {
  INSTALL_LOCALIZATION,
  getLocalizedText,
  getBilingualAriaLabel,
} from './installLocalization';

describe('Install Localization', () => {
  it('should have consistent English and Malayalam translations', () => {
    expect(INSTALL_LOCALIZATION.english.buttonText).toBe('Install App');
    expect(INSTALL_LOCALIZATION.malayalam.buttonText).toBe(
      'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക'
    );

    expect(INSTALL_LOCALIZATION.english.benefits).toHaveLength(4);
    expect(INSTALL_LOCALIZATION.malayalam.benefits).toHaveLength(4);
  });

  it('should provide proper aria labels for both languages', () => {
    expect(INSTALL_LOCALIZATION.ariaLabels.english.installButton).toContain(
      'Install Madrasa Portal'
    );
    expect(INSTALL_LOCALIZATION.ariaLabels.malayalam.installButton).toContain(
      'മദ്രസ പോർട്ടൽ'
    );
  });

  it('should get localized text with fallback', () => {
    expect(getLocalizedText('buttonText', 'english')).toBe('Install App');
    expect(getLocalizedText('buttonText', 'malayalam')).toBe(
      'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക'
    );
    expect(getLocalizedText('nonexistent.path')).toBe('nonexistent.path');
  });

  it('should create bilingual aria labels', () => {
    const bilingualLabel = getBilingualAriaLabel('installButton');
    expect(bilingualLabel).toContain('Install Madrasa Portal');
    expect(bilingualLabel).toContain('മദ്രസ പോർട്ടൽ');
  });
});
