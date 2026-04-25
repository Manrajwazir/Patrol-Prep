// lib/language.ts
export type Language = "English" | "Spanish" | "Tagalog" | "Punjabi";

export const LANGUAGES: { code: Language; label: string; flag: string; transcribeCode: string; cultural: string }[] = [
    { code: "English", label: "English", flag: "🇨🇦", transcribeCode: "en-US", cultural: "general" },
    { code: "Spanish", label: "Español", flag: "🇪🇸", transcribeCode: "es-US", cultural: "Latin American" },
    { code: "Tagalog", label: "Tagalog", flag: "🇵🇭", transcribeCode: "tl-PH", cultural: "Filipino" },
    { code: "Punjabi", label: "ਪੰਜਾਬੀ", flag: "🇮🇳", transcribeCode: "pa-IN", cultural: "South Asian" },
];

export function getLanguage(): Language {
    if (typeof window === "undefined") return "English";
    return (localStorage.getItem("patrolprep-lang") as Language) || "English";
}

export function setLanguage(lang: Language) {
    localStorage.setItem("patrolprep-lang", lang);
}