import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'te' | 'hi';

interface Translations {
  appName: string;
  tagline: string;
  selectLanguage: string;
  clientRole: string;
  advocateRole: string;
  clientDesc: string;
  advocateDesc: string;
  continue: string;
  demoMode: string;
  welcomeBack: string;
  askAiPlaceholder: string;
  voiceAction: string;
  uploadAction: string;
  recentCases: string;
  findAdvocate: string;
  askAi: string;
  trackCase: string;
  uploadDoc: string;
  caseStatus: string;
  timeline: string;
  appointments: string;
  healthScore: string;
  whatHappensNext: string;
  educationalDisclaimer: string;
  experience: string;
  languages: string;
  fees: string;
  verified: string;
  matchScore: string;
  bookConsultation: string;
  biography: string;
  reviews: string;
  jargonExplainer: string;
  commonMissingDocs: string;
  keyPoints: string;
  summary: string;
  uploadPrompt: string;
  hearingExplainerTitle: string;
  originalLegalese: string;
  aiPlainExplanation: string;
  stage: string;
  nextHearing: string;
  logout: string;
  switchDashboard: string;
  illiterateFriendlyTip: string;
  speakToUs: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appName: "Nyaya Setu",
    tagline: "Justice Made Simple for Everyone.",
    selectLanguage: "Choose Your Language / భాషను ఎంచుకోండి / भाषा चुनें",
    clientRole: "I need Legal Help",
    advocateRole: "I am an Advocate",
    clientDesc: "Understand legal problems, find lawyers, and track your case.",
    advocateDesc: "Manage cases, post hearing updates, and connect with clients.",
    continue: "Continue",
    demoMode: "Enter Demo Mode (Instant Experience)",
    welcomeBack: "Welcome Back",
    askAiPlaceholder: "What legal problem are you facing today?",
    voiceAction: "Speak & Ask Nyaya Copilot",
    uploadAction: "Check Document",
    recentCases: "My Active Cases",
    findAdvocate: "Find Advocate",
    askAi: "Ask Nyaya Copilot",
    trackCase: "Track Case Status",
    uploadDoc: "Upload Document",
    caseStatus: "Case Status",
    timeline: "Case Timeline",
    appointments: "My Appointments",
    healthScore: "Case Health Score",
    whatHappensNext: "What Happens Next?",
    educationalDisclaimer: "This information is educational only. Final legal advice should come from a licensed advocate.",
    experience: "Years Experience",
    languages: "Languages Spoken",
    fees: "Consultation Fee",
    verified: "Verified Advocate",
    matchScore: "Match Score",
    bookConsultation: "Book Free Consultation",
    biography: "About the Advocate",
    reviews: "Client Reviews",
    jargonExplainer: "Nyaya Copilot Word Explainer",
    commonMissingDocs: "Suggested Missing Documents",
    keyPoints: "Important Points",
    summary: "Nyaya Copilot Document Summary",
    uploadPrompt: "Drag & drop your document here, or click to upload",
    hearingExplainerTitle: "Nyaya Copilot Order Explainer",
    originalLegalese: "Court Order / Legalese Note",
    aiPlainExplanation: "Nyaya Copilot Explanation",
    stage: "Current Stage",
    nextHearing: "Next Hearing Date",
    logout: "Log Out",
    switchDashboard: "Switch to Advocate View",
    illiterateFriendlyTip: "Tip: Tap any microphone button to speak instead of writing.",
    speakToUs: "Tap and speak your problem to us"
  },
  te: {
    appName: "న్యాయ సేతు",
    tagline: "అందరికీ సులభంగా న్యాయం.",
    selectLanguage: "Choose Your Language / భాషను ఎంచుకోండి / भाषा चुनें",
    clientRole: "నాకు న్యాయ సహాయం కావాలి",
    advocateRole: "నేను న్యాయవాదిని",
    clientDesc: "సమస్యలను అర్థం చేసుకోండి, లాయర్లను కనుగొనండి, కేసును ట్రాక్ చేయండి.",
    advocateDesc: "కేసులను నిర్వహించండి, కోర్టు అప్‌డేట్‌లను పంచుకోండి, క్లయింట్లతో కనెక్ట్ అవ్వండి.",
    continue: "కొనసాగించు",
    demoMode: "డెమో మోడ్ (వెంటనే ఉపయోగించి చూడండి)",
    welcomeBack: "స్వాగతం",
    askAiPlaceholder: "మీరు ఈరోజు ఏ చట్టపరమైన సమస్యను ఎదుర్కొంటున్నారు?",
    voiceAction: "మాట్లాడి న్యాయ కోపైలట్ ని అడగండి",
    uploadAction: "పత్రాలను తనిఖీ చేయండి",
    recentCases: "నా యాక్టివ్ కేసులు",
    findAdvocate: "న్యాయవాదిని వెతకండి",
    askAi: "న్యాయ కోపైలట్ ని అడగండి",
    trackCase: "కేసు స్థితిని చూడండి",
    uploadDoc: "పత్రాన్ని అప్‌లోడ్ చేయండి",
    caseStatus: "కేసు స్థితి",
    timeline: "కేసు టైమ్‌లైన్",
    appointments: "నా అపాయింట్‌మెంట్‌లు",
    healthScore: "కేసు హెల్త్ స్కోర్",
    whatHappensNext: "తర్వాత ఏం జరుగుతుంది?",
    educationalDisclaimer: "ఈ సమాచారం కేవలం విద్యా ప్రయోజనాల కోసం మాత్రమే. తుది న్యాయ సలహా లైసెన్స్ పొందిన న్యాయవాది నుంచే పొందాలి.",
    experience: "సంవత్సరాల అనుభవం",
    languages: "మాట్లాడే భాషలు",
    fees: "సంప్రదింపు రుసుము",
    verified: "ధృవీకరించబడిన న్యాయవాది",
    matchScore: "మ్యాచ్ స్కోరు",
    bookConsultation: "ఉచిత అపాయింట్‌మెంట్ బుక్ చేయండి",
    biography: "న్యాయవాది గురించి",
    reviews: "క్లయింట్ల అభిప్రాయాలు",
    jargonExplainer: "న్యాయ కోపైలట్ పదాల వివరణ",
    commonMissingDocs: "తదుపరి అవసరమయ్యే పత్రాలు",
    keyPoints: "ముఖ్యమైన విషయాలు",
    summary: "న్యాయ కోపైలట్ పత్ర సారాంశం",
    uploadPrompt: "మీ పత్రాన్ని ఇక్కడ లాగి వదలండి, లేదా అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి",
    hearingExplainerTitle: "న్యాయ కోపైలట్ కోర్టు ఆర్డర్ అనువాదం",
    originalLegalese: "అసలు కోర్టు ఆర్డర్ (కఠిన పదాలు)",
    aiPlainExplanation: "న్యాయ కోపైలట్ వివరణ",
    stage: "ప్రస్తుత దశ",
    nextHearing: "తదుపరి విచారణ తేదీ",
    logout: "లాగ్ అవుట్",
    switchDashboard: "న్యాయవాది డాష్‌బోర్డ్‌కు మారండి",
    illiterateFriendlyTip: "చిట్కా: రాయడానికి బదులుగా మాట్లాడటానికి మైక్రోఫోన్ బటన్‌ను నొక్కండి.",
    speakToUs: "నొక్కండి మరియు మీ సమస్యను మాతో మాట్లాడండి"
  },
  hi: {
    appName: "न्याय सेतु",
    tagline: "न्याय हर किसी के लिए सरल।",
    selectLanguage: "Choose Your Language / భాషను ఎంచుకోండి / भाषा चुनें",
    clientRole: "मुझे कानूनी मदद चाहिए",
    advocateRole: "मैं एक वकील हूँ",
    clientDesc: "कानूनी समस्याओं को समझें, वकील खोजें और अपने केस को ट्रैक करें।",
    advocateDesc: "मामलों का प्रबंधन करें, सुनवाई अपडेट डालें और ग्राहकों से जुड़ें।",
    continue: "आगे बढ़ें",
    demoMode: "डेमो मोड (तुरंत अनुभव करें)",
    welcomeBack: "आपका स्वागत है",
    askAiPlaceholder: "आज आप किस कानूनी समस्या का सामना कर रहे हैं?",
    voiceAction: "बोलें और न्याय कोपायलट से पूछें",
    uploadAction: "दस्तावेज़ की जांच करें",
    recentCases: "मेरे सक्रिय मामले",
    findAdvocate: "वकील खोजें",
    askAi: "न्याय कोपायलट से पूछें",
    trackCase: "केस की स्थिति ट्रैक करें",
    uploadDoc: "दस्तावेज़ अपलोड करें",
    caseStatus: "केस की स्थिति",
    timeline: "केस की समयरेखा (Timeline)",
    appointments: "मेरे अपॉइंटमेंट",
    healthScore: "केस हेल्थ स्कोर",
    whatHappensNext: "आगे क्या होगा?",
    educationalDisclaimer: "यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है। अंतिम कानूनी सलाह एक लाइसेंस प्राप्त वकील से ही ली जानी चाहिए।",
    experience: "वर्षों का अनुभव",
    languages: "बोली जाने वाली भाषाएं",
    fees: "परामर्श शुल्क",
    verified: "सत्यापित वकील",
    matchScore: "मैच स्कोर",
    bookConsultation: "मुफ़्त परामर्श बुक करें",
    biography: "वकील के बारे में",
    reviews: "क्लाइंट की समीक्षाएं",
    jargonExplainer: "न्याय कोपायलट शब्दावली व्याख्या",
    commonMissingDocs: "आवश्यक लापता दस्तावेज़",
    keyPoints: "महत्वपूर्ण बिंदु",
    summary: "न्याय कोपायलट दस्तावेज़ सारांश",
    uploadPrompt: "अपने दस्तावेज़ को यहाँ खींचें और छोड़ें, या अपलोड करने के लिए क्लिक करें",
    hearingExplainerTitle: "न्याय कोपायलट कोर्ट आदेश अनुवाद",
    originalLegalese: "मूल कोर्ट आदेश (कठिन शब्द)",
    aiPlainExplanation: "न्याय कोपायलट व्याख्या",
    stage: "वर्तमान चरण",
    nextHearing: "अगली सुनवाई की तारीख",
    logout: "लॉग आउट",
    switchDashboard: "वकील दृश्य पर जाएं",
    illiterateFriendlyTip: "सुझाव: लिखने के बजाय बोलने के लिए किसी भी माइक्रोफ़ोन बटन को दबाएं।",
    speakToUs: "दबाएं और अपनी समस्या हमें बोलकर बताएं"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('nyaya_setu_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nyaya_setu_lang', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
