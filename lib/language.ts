// lib/language.ts
export type Language = "English" | "Spanish" | "Tagalog" | "Punjabi" | "French";

export const LANGUAGES: { code: Language; label: string; transcribeCode: string; cultural: string }[] = [
    { code: "English", label: "English", transcribeCode: "en-US", cultural: "general" },
    { code: "Spanish", label: "Español", transcribeCode: "es-US", cultural: "Latin American" },
    { code: "Tagalog", label: "Tagalog", transcribeCode: "tl-PH", cultural: "Filipino" },
    { code: "Punjabi", label: "ਪੰਜਾਬੀ", transcribeCode: "pa-IN", cultural: "South Asian" },
    { code: "French", label: "Français", transcribeCode: "fr-FR", cultural: "Francophone" },
];

export const COUNTRIES = [
    { name: "Canada", flag: "🇨🇦" },
    { name: "Colombia", flag: "🇨🇴" },
    { name: "Mexico", flag: "🇲🇽" },
    { name: "Philippines", flag: "🇵🇭" },
    { name: "India", flag: "🇮🇳" },
    { name: "DR Congo", flag: "🇨🇩" },
    { name: "Senegal", flag: "🇸🇳" },
    { name: "France", flag: "🇫🇷" },
    { name: "Nigeria", flag: "🇳🇬" },
    { name: "Other", flag: "🌍" },
];

export function getLanguage(): Language {
    if (typeof window === "undefined") return "English";
    return (localStorage.getItem("patrolprep-lang") as Language) || "English";
}

export function setLanguage(lang: Language) {
    localStorage.setItem("patrolprep-lang", lang);
    window.dispatchEvent(new Event("language-change"));
}

export function getCountry(): string {
    if (typeof window === "undefined") return "Canada";
    return localStorage.getItem("patrolprep-country") || "Canada";
}

export function setCountry(country: string) {
    localStorage.setItem("patrolprep-country", country);
    window.dispatchEvent(new Event("country-change"));
}