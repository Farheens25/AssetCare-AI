import { useEffect } from "react";

const GoogleTranslate = () => {
  useEffect(() => {
    // ================================================
    // GOOGLE TRANSLATE CALLBACK
    // ================================================

    window.googleTranslateElementInit = () => {
      const element = document.getElementById(
        "google_translate_element"
      );

      if (
        window.google &&
        window.google.translate &&
        element
      ) {
        // Prevent duplicate initialization
        if (element.dataset.initialized === "true") {
          return;
        }

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr",
            autoDisplay: false,
            multilanguagePage: true,
          },
          "google_translate_element"
        );

        element.dataset.initialized = "true";
      }
    };

    // ================================================
    // LOAD GOOGLE TRANSLATE SCRIPT
    // ================================================

    const existingScript = document.querySelector(
      'script[src*="translate.google.com/translate_a/element.js"]'
    );

    if (!existingScript) {
      const script = document.createElement("script");

      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

      script.async = true;

      document.body.appendChild(script);
    } else if (
      window.google &&
      window.google.translate
    ) {
      window.googleTranslateElementInit();
    }

    return () => {
      // Do not remove Google Translate script
    };
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{
        position: "fixed",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    />
  );
};

export default GoogleTranslate;


// ======================================================
// GOOGLE LANGUAGE CHANGER
// ======================================================

export const changeGoogleLanguage = (language) => {
  const languageMap = {
    EN: "en",
    HI: "hi",
    MR: "mr",
  };

  const targetLanguage = languageMap[language];

  if (!targetLanguage) {
    return;
  }

  // ====================================================
  // ENGLISH
  // ====================================================

  if (targetLanguage === "en") {
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    document.cookie =
      `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;

    window.location.reload();

    return;
  }

  // ====================================================
  // HINDI / MARATHI
  // ====================================================

  document.cookie =
    `googtrans=/en/${targetLanguage}; path=/;`;

  document.cookie =
    `googtrans=/en/${targetLanguage}; path=/; domain=${window.location.hostname};`;

  // Reload complete website
  window.location.reload();
};