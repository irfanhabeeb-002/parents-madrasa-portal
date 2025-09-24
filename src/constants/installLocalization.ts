/**
 * Centralized localization constants for PWA install components
 * Provides consistent English and Malayalam translations across InstallPrompt and InstallButton
 */

export interface InstallLocalization {
  english: {
    buttonText: string;
    modalTitle: string;
    description: string;
    benefits: string[];
    actions: {
      install: string;
      installing: string;
      learnMore: string;
      maybeLater: string;
      installNow: string;
      close: string;
    };
    status: {
      installed: string;
      notAvailable: string;
      dismissed: string;
    };
  };
  malayalam: {
    buttonText: string;
    modalTitle: string;
    description: string;
    benefits: string[];
    actions: {
      install: string;
      installing: string;
      learnMore: string;
      maybeLater: string;
      installNow: string;
      close: string;
    };
    status: {
      installed: string;
      notAvailable: string;
      dismissed: string;
    };
  };
  ariaLabels: {
    english: {
      installButton: string;
      installBanner: string;
      installModal: string;
      dismissBanner: string;
      learnMore: string;
      installNow: string;
      closeModal: string;
      installedStatus: string;
      notAvailableStatus: string;
      dismissedStatus: string;
    };
    malayalam: {
      installButton: string;
      installBanner: string;
      installModal: string;
      dismissBanner: string;
      learnMore: string;
      installNow: string;
      closeModal: string;
      installedStatus: string;
      notAvailableStatus: string;
      dismissedStatus: string;
    };
  };
}

export const INSTALL_LOCALIZATION: InstallLocalization = {
  english: {
    buttonText: 'Install App',
    modalTitle: 'Install Madrasa Portal',
    description:
      'Install the app on your device for quick access and offline functionality',
    benefits: [
      'Quick access from home screen',
      'Works offline for cached content',
      'Push notifications for classes',
      'Full-screen app experience',
    ],
    actions: {
      install: 'Install',
      installing: 'Installing...',
      learnMore: 'Learn More',
      maybeLater: 'Maybe Later',
      installNow: 'Install Now',
      close: 'Close',
    },
    status: {
      installed: 'App Installed',
      notAvailable: 'Install not available',
      dismissed: 'Install option dismissed',
    },
  },
  malayalam: {
    buttonText: 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക',
    modalTitle: 'മദ്രസ പോർട്ടൽ ഇൻസ്റ്റാൾ ചെയ്യുക',
    description:
      'വേഗത്തിലുള്ള ആക്സസിനും ഓഫ്‌ലൈൻ പ്രവർത്തനത്തിനുമായി നിങ്ങളുടെ ഉപകരണത്തിൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക',
    benefits: [
      'ഹോം സ്ക്രീനിൽ നിന്ന് വേഗത്തിലുള്ള ആക്സസ്',
      'കാഷെ ചെയ്ത ഉള്ളടക്കത്തിനായി ഓഫ്‌ലൈൻ പ്രവർത്തിക്കുന്നു',
      'ക്ലാസുകൾക്കുമായി പുഷ് അറിയിപ്പുകൾ',
      'പൂർണ്ണ സ്ക്രീൻ ആപ്പ് അനുഭവം',
    ],
    actions: {
      install: 'ഇൻസ്റ്റാൾ ചെയ്യുക',
      installing: 'ഇൻസ്റ്റാൾ ചെയ്യുന്നു...',
      learnMore: 'കൂടുതൽ അറിയുക',
      maybeLater: 'പിന്നീട്',
      installNow: 'ഇപ്പോൾ ഇൻസ്റ്റാൾ ചെയ്യുക',
      close: 'അടയ്ക്കുക',
    },
    status: {
      installed: 'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു',
      notAvailable: 'ഇൻസ്റ്റാൾ ലഭ്യമല്ല',
      dismissed: 'ഇൻസ്റ്റാൾ ഓപ്ഷൻ നിരസിച്ചു',
    },
  },
  ariaLabels: {
    english: {
      installButton:
        'Install Madrasa Portal app on your device for quick access and offline functionality',
      installBanner:
        'Install app banner. You can install this app for a better experience.',
      installModal:
        'Install app details modal with benefits and installation options',
      dismissBanner:
        'Dismiss install banner. You can install the app later from your browser menu.',
      learnMore:
        'Learn more about installing the app. Opens detailed information modal.',
      installNow:
        'Install Madrasa Portal app now. This will add the app to your device.',
      closeModal: 'Close install modal and maybe install later',
      installedStatus: 'App is already installed on your device',
      notAvailableStatus:
        'App installation is not available on this browser or device',
      dismissedStatus: 'Install option was recently dismissed',
    },
    malayalam: {
      installButton:
        'വേഗത്തിലുള്ള ആക്സസിനും ഓഫ്‌ലൈൻ പ്രവർത്തനത്തിനുമായി നിങ്ങളുടെ ഉപകരണത്തിൽ മദ്രസ പോർട്ടൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക',
      installBanner:
        'ആപ്പ് ഇൻസ്റ്റാൾ ബാനർ. മികച്ച അനുഭവത്തിനായി ഈ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാം.',
      installModal:
        'ആപ്പ് ഇൻസ്റ്റാൾ വിശദാംശങ്ങളുടെ മോഡൽ ആനുകൂല്യങ്ങളും ഇൻസ്റ്റാളേഷൻ ഓപ്ഷനുകളും',
      dismissBanner:
        'ഇൻസ്റ്റാൾ ബാനർ നിരസിക്കുക. നിങ്ങളുടെ ബ്രൗസർ മെനുവിൽ നിന്ന് പിന്നീട് ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാം.',
      learnMore:
        'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുന്നതിനെക്കുറിച്ച് കൂടുതൽ അറിയുക. വിശദമായ വിവര മോഡൽ തുറക്കുന്നു.',
      installNow:
        'മദ്രസ പോർട്ടൽ ആപ്പ് ഇപ്പോൾ ഇൻസ്റ്റാൾ ചെയ്യുക. ഇത് നിങ്ങളുടെ ഉപകരണത്തിൽ ആപ്പ് ചേർക്കും.',
      closeModal: 'ഇൻസ്റ്റാൾ മോഡൽ അടയ്ക്കുക, പിന്നീട് ഇൻസ്റ്റാൾ ചെയ്യാം',
      installedStatus:
        'ആപ്പ് ഇതിനകം നിങ്ങളുടെ ഉപകരണത്തിൽ ഇൻസ്റ്റാൾ ചെയ്തിട്ടുണ്ട്',
      notAvailableStatus: 'ഈ ബ്രൗസറിലോ ഉപകരണത്തിലോ ആപ്പ് ഇൻസ്റ്റാളേഷൻ ലഭ്യമല്ല',
      dismissedStatus: 'ഇൻസ്റ്റാൾ ഓപ്ഷൻ അടുത്തിടെ നിരസിച്ചു',
    },
  },
};

/**
 * Helper function to get localized text with fallback
 */
export const getLocalizedText = (
  path: string,
  language: 'english' | 'malayalam' = 'english'
): string => {
  const keys = path.split('.');
  let current: any = INSTALL_LOCALIZATION[language];

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Fallback to English if Malayalam translation is missing
      if (language === 'malayalam') {
        return getLocalizedText(path, 'english');
      }
      console.warn(`Missing localization for path: ${path}`);
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
};

/**
 * Helper function to get aria-label with both languages
 */
export const getBilingualAriaLabel = (key: string): string => {
  const englishLabel =
    INSTALL_LOCALIZATION.ariaLabels.english[
      key as keyof typeof INSTALL_LOCALIZATION.ariaLabels.english
    ];
  const malayalamLabel =
    INSTALL_LOCALIZATION.ariaLabels.malayalam[
      key as keyof typeof INSTALL_LOCALIZATION.ariaLabels.malayalam
    ];

  if (englishLabel && malayalamLabel) {
    return `${englishLabel}. ${malayalamLabel}`;
  }

  return englishLabel || malayalamLabel || key;
};
