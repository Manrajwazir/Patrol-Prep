// lib/language.ts
export type Language = "English" | "Spanish" | "Tagalog" | "Punjabi" | "French";

export const LANGUAGES: { code: Language; label: string; flag: string; transcribeCode: string; cultural: string; homeCountry: string }[] = [
    { code: "English", label: "English", flag: "🇨🇦", transcribeCode: "en-US", cultural: "general", homeCountry: "Common Law / General" },
    { code: "Spanish", label: "Español", flag: "🇨🇴", transcribeCode: "es-US", cultural: "Latin American", homeCountry: "Latin America (e.g., Colombia, Mexico)" },
    { code: "Tagalog", label: "Tagalog", flag: "🇵🇭", transcribeCode: "tl-PH", cultural: "Filipino", homeCountry: "Philippines" },
    { code: "Punjabi", label: "ਪੰਜਾਬੀ", flag: "🇮🇳", transcribeCode: "pa-IN", cultural: "South Asian", homeCountry: "India" },
    { code: "French", label: "Français", flag: "🇨🇩", transcribeCode: "fr-FR", cultural: "Francophone", homeCountry: "Francophone Countries (e.g., DRC, Senegal)" },
];

export function getLanguage(): Language {
    if (typeof window === "undefined") return "English";
    return (localStorage.getItem("patrolprep-lang") as Language) || "English";
}

export function setLanguage(lang: Language) {
    localStorage.setItem("patrolprep-lang", lang);
}