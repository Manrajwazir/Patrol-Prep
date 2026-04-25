// data/concept-bridge.ts
import { Language } from "@/lib/language";

export const BRIDGES: Record<string, Record<Language, { home: string; comparison: string }>> = {
    use_of_force: {
        English: { home: "Common Law", comparison: "Section 25 of the Criminal Code is similar to many common law jurisdictions, strictly requiring reasonable grounds and proportionality." },
        Spanish: { home: "América Latina", comparison: "A diferencia de algunos países latinoamericanos donde la defensa propia tiene reglas más amplias para proteger la propiedad, en Canadá la fuerza debe ser siempre proporcional y enfocada en la autopreservación." },
        Tagalog: { home: "Pilipinas", comparison: "Sa Pilipinas, ang self-defense sa ilalim ng Art. 11 ng Revised Penal Code ay may mas malawak na saklaw kaysa sa Canada. Sa Canada, mahigpit ang requirement na 'reasonable force' at hindi maaaring gamitin ang nakakamatay na pwersa para lang sa ari-arian." },
        Punjabi: { home: "ਭਾਰਤ", comparison: "ਭਾਰਤੀ ਦੰਡਾਵਲੀ (IPC) ਦੀ ਧਾਰਾ 96-106 ਦੇ ਮੁਕਾਬਲੇ, ਕੈਨੇਡਾ ਵਿੱਚ ਪ੍ਰਾਈਵੇਟ ਡਿਫੈਂਸ ਦੇ ਅਧਿਕਾਰ ਵਧੇਰੇ ਸੀਮਤ ਹਨ। ਇੱਥੇ ਹਮੇਸ਼ਾ ਘੱਟੋ-ਘੱਟ ਜ਼ਰੂਰੀ ਤਾਕਤ ਦੀ ਵਰਤੋਂ ਕਰਨੀ ਪੈਂਦੀ ਹੈ।" },
        French: { home: "Afrique Francophone / France", comparison: "Contrairement à la notion de légitime défense qui peut parfois englober la protection des biens dans d'autres juridictions francophones, la loi canadienne exige une stricte proportionnalité et limite la force mortelle à la préservation de la vie." },
    },
    lawful_detention: {
        English: { home: "General", comparison: "Citizen's arrest powers are strictly limited. You must witness the indictable offence yourself." },
        Spanish: { home: "América Latina", comparison: "En muchos países, un guardia de seguridad tiene más autoridad que un ciudadano común. En Canadá, un guardia tiene exactamente los mismos poderes de arresto que cualquier ciudadano (Sección 494)." },
        Tagalog: { home: "Pilipinas", comparison: "Hindi tulad sa Pilipinas kung saan ang mga security guard ay may awtoridad na parang pulis sa loob ng kanilang post, sa Canada ang mga guard ay may parehong limitadong kapangyarihan tulad ng ordinaryong mamamayan." },
        Punjabi: { home: "ਭਾਰਤ", comparison: "ਭਾਰਤ ਵਿੱਚ ਸੁਰੱਖਿਆ ਕਰਮਚਾਰੀਆਂ ਨੂੰ ਕਈ ਵਾਰ ਵਿਸ਼ੇਸ਼ ਅਧਿਕਾਰ ਦਿੱਤੇ ਜਾਂਦੇ ਹਨ, ਪਰ ਕੈਨੇਡਾ ਵਿੱਚ ਇੱਕ ਸੁਰੱਖਿਆ ਗਾਰਡ ਕੋਲ ਇੱਕ ਆਮ ਨਾਗਰਿਕ ਜਿੰਨੇ ਹੀ ਗ੍ਰਿਫਤਾਰੀ ਦੇ ਅਧਿਕਾਰ (ਸਿਟੀਜ਼ਨ ਅਰੈਸਟ) ਹੁੰਦੇ ਹਨ।" },
        French: { home: "Afrique Francophone / France", comparison: "Dans de nombreux pays, un agent de sécurité a plus d'autorité. Au Canada, l'agent a exactement les mêmes pouvoirs d'arrestation qu'un simple citoyen." },
    },
    charter_rights: {
        English: { home: "Constitutional", comparison: "The Charter protects against unreasonable search and arbitrary detention." },
        Spanish: { home: "Derechos Constitucionales", comparison: "Similar a las garantías individuales, la Carta canadiense exige que siempre se informe a un detenido de sus derechos de inmediato, incluyendo el derecho a un abogado." },
        Tagalog: { home: "Bill of Rights", comparison: "Kapareho ng Bill of Rights sa Pilipinas, ngunit sa Canada ay mahigpit na ipinapatupad ang Section 10 (Right to Counsel) sa oras mismo ng pag-aresto o detention." },
        Punjabi: { home: "ਮੌਲਿਕ ਅਧਿਕਾਰ", comparison: "ਭਾਰਤੀ ਸੰਵਿਧਾਨ ਦੇ ਮੌਲਿਕ ਅਧਿਕਾਰਾਂ ਵਾਂਗ, ਕੈਨੇਡੀਅਨ ਚਾਰਟਰ ਕਿਸੇ ਵੀ ਵਿਅਕਤੀ ਨੂੰ ਬਿਨਾਂ ਕਾਰਨ ਹਿਰਾਸਤ ਵਿੱਚ ਰੱਖਣ ਤੋਂ ਰੋਕਦਾ ਹੈ।" },
        French: { home: "Droits Constitutionnels", comparison: "Similaire aux droits fondamentaux, la Charte canadienne exige qu'un détenu soit immédiatement informé de ses droits, y compris le droit à un avocat." },
    },
    note_taking_reporting: {
        English: { home: "Legal Records", comparison: "Notes must be uncompromised and written in pen, as they are legal documents." },
        Spanish: { home: "Registros Legales", comparison: "Las notas en Canadá se consideran evidencia legal admisible. Nunca deben contener opiniones, solo hechos, y siempre escribirse con bolígrafo, no lápiz." },
        Tagalog: { home: "Logbook / Report", comparison: "Hindi tulad ng simpleng logbook, ang notebook ng security guard sa Canada ay maaaring gamitin sa korte bilang ebidensya kaya dapat tumpak at walang burador (lapis)." },
        Punjabi: { home: "ਕਾਨੂੰਨੀ ਰਿਕਾਰਡ", comparison: "ਕੈਨੇਡਾ ਵਿੱਚ ਸੁਰੱਖਿਆ ਗਾਰਡ ਦੀ ਨੋਟਬੁੱਕ ਨੂੰ ਅਦਾਲਤ ਵਿੱਚ ਸਬੂਤ ਵਜੋਂ ਵਰਤਿਆ ਜਾ ਸਕਦਾ ਹੈ। ਇਸ ਲਈ ਇਹ ਹਮੇਸ਼ਾ ਪੈੱਨ ਨਾਲ ਲਿਖੀ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ, ਪੈਨਸਿਲ ਨਾਲ ਨਹੀਂ।" },
        French: { home: "Registres Légaux", comparison: "Les notes au Canada sont considérées comme des preuves légales admissibles. Elles ne doivent jamais contenir d'opinions, seulement des faits, et toujours être écrites au stylo." },
    },
    patrol_procedures: {
        English: { home: "Standard Patrol", comparison: "Focus is on observation, utilizing all senses without distraction." },
        Spanish: { home: "Patrullaje", comparison: "El enfoque principal del patrullaje en Canadá es la observación discreta y la prevención, evitando la confrontación física siempre que sea posible." },
        Tagalog: { home: "Pagpapatrolya", comparison: "Sa Canada, ang patrol ay mas nakatuon sa pagmamasid at pag-iwas sa gulo, kaysa sa pagiging agresibong tagapagpatupad ng patakaran." },
        Punjabi: { home: "ਗਸ਼ਤ", comparison: "ਕੈਨੇਡਾ ਵਿੱਚ ਗਸ਼ਤ ਦਾ ਮੁੱਖ ਉਦੇਸ਼ ਨਿਗਰਾਨੀ ਕਰਨਾ ਅਤੇ ਖਤਰੇ ਨੂੰ ਪਛਾਣਨਾ ਹੈ, ਨਾ ਕਿ ਖੁਦ ਕਾਰਵਾਈ ਕਰਨਾ।" },
        French: { home: "Patrouille", comparison: "L'objectif principal de la patrouille au Canada est l'observation discrète et la prévention, en évitant la confrontation physique." },
    },
    emergency_response: {
        English: { home: "Emergency", comparison: "Prioritize alarm activation and evacuation over fighting fires." },
        Spanish: { home: "Emergencias", comparison: "La regla principal en Canadá ante incendios es activar la alarma y evacuar. Solo se combate el fuego si es pequeño y el escape está asegurado." },
        Tagalog: { home: "Tugon sa Emergency", comparison: "Kabaligtaran sa pagiging 'hero', ang protocol sa Canada ay inuuna palagi ang pag-activate ng alarm at paglilikas bago subukang apulahin ang apoy." },
        Punjabi: { home: "ਐਮਰਜੈਂਸੀ", comparison: "ਕੈਨੇਡਾ ਵਿੱਚ ਅੱਗ ਲੱਗਣ ਦੀ ਸਥਿਤੀ ਵਿੱਚ ਸਭ ਤੋਂ ਪਹਿਲਾ ਕੰਮ ਅਲਾਰਮ ਵਜਾਉਣਾ ਅਤੇ ਇਮਾਰਤ ਨੂੰ ਖਾਲੀ ਕਰਵਾਉਣਾ ਹੈ।" },
        French: { home: "Urgences", comparison: "La règle principale au Canada face aux incendies est d'activer l'alarme et d'évacuer. On ne combat le feu que s'il est petit et que la fuite est assurée." },
    }
};
