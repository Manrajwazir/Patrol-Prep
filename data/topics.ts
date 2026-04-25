// data/topics.ts
export const TOPICS = [
    {
        id: "use_of_force",
        title: "Use of Force",
        module: "Module Two",
        pages: "Pages 17-19",
        color: "var(--topic-use_of_force)",
        icon: "🛡️",
        summary: "When and how a security professional may use force, governed primarily by Section 25 of the Criminal Code. Emphasizes avoidance and proportionality.",
        keyConcepts: [
            {
                title: "Section 25 — Justified Force",
                excerpt: "Every one who is required or authorized by law... is, if he acts on reasonable grounds, justified in doing what he is required or authorized to do and in using as much force as is necessary for that purpose.",
                section: "§25 Criminal Code",
            },
            {
                title: "Excessive Force Liability",
                excerpt: "Every one who is authorized by law to use force is criminally responsible for any excess thereof according to the nature and quality of the act that constitutes the excess.",
                section: "§26 Criminal Code",
            },
            {
                title: "Determining 'Reasonable Force'",
                excerpt: "'Reasonable force' is determined by the situation in which it is to be applied. The amount of force used must be consistent with the physical and mental characteristics of the subject, and must be appropriate to the situation at hand.",
                section: "Alberta Security Manual",
            }
        ]
    },
    {
        id: "lawful_detention",
        title: "Lawful Detention",
        module: "Module Two",
        pages: "Pages 4-7",
        color: "var(--topic-lawful_detention)",
        icon: "🛑",
        summary: "The rules governing citizen's arrests under Section 494, emphasizing that security professionals have no greater arrest powers than ordinary citizens.",
        keyConcepts: [
            {
                title: "Citizen's Arrest Powers",
                excerpt: "Any one may arrest without warrant a person whom he finds committing an indictable offence. To 'find someone committing an indictable offence' means you must catch them in the act.",
                section: "§494(1)(a) Criminal Code",
            },
            {
                title: "Delivery to a Peace Officer",
                excerpt: "Any one other than a peace officer who arrests a person without warrant shall forthwith deliver the person to a peace officer.",
                section: "§494 Criminal Code",
            },
            {
                title: "Reasonable Grounds Standard",
                excerpt: "Reasonable grounds describe an instance where the facts and information available in a given situation would lead the average person to conclude a criminal act has occurred.",
                section: "Alberta Security Manual",
            }
        ]
    },
    {
        id: "charter_rights",
        title: "Charter Rights",
        module: "Module Two",
        pages: "Pages 2-4",
        color: "var(--topic-charter_rights)",
        icon: "📜",
        summary: "Key protections under the Canadian Charter of Rights and Freedoms that impact how security guards must conduct searches and detentions.",
        keyConcepts: [
            {
                title: "Protection from Arbitrary Detention",
                excerpt: "Everyone has the right not to be arbitrarily detained or imprisoned.",
                section: "§9 Charter of Rights",
            },
            {
                title: "Rights Upon Arrest",
                excerpt: "Everyone has the right on arrest or detention to be informed promptly of the reasons therefor; to retain and instruct counsel without delay and to be informed of that right.",
                section: "§10 Charter of Rights",
            },
            {
                title: "Protection Against Unreasonable Search",
                excerpt: "Everyone has the right to be secure against unreasonable search or seizure.",
                section: "§8 Charter of Rights",
            }
        ]
    },
    {
        id: "note_taking_reporting",
        title: "Note Taking & Reporting",
        module: "Module Five",
        pages: "Pages 3-6",
        color: "var(--topic-note_taking_reporting)",
        icon: "📝",
        summary: "The principles of maintaining accurate, uncompromised, and legally admissible notebooks as a security professional.",
        keyConcepts: [
            {
                title: "The 6 Core Elements",
                excerpt: "Writing in your notebook is similar to the way reporters create a news story; you should be including the details about WHO, WHAT, WHERE, WHEN, WHY and HOW?",
                section: "Alberta Security Manual",
            },
            {
                title: "Handling Unknowns",
                excerpt: "Do not assume you know why something happened. If you do not know and the witness information cannot explain, write nothing.",
                section: "Alberta Security Manual",
            },
            {
                title: "Legal Admissibility",
                excerpt: "The notes you write may eventually be used in court. You must ensure your notes are accurate, complete, and uncompromised. Always use a pen, never a pencil.",
                section: "Alberta Security Manual",
            }
        ]
    },
    {
        id: "patrol_procedures",
        title: "Patrol Procedures",
        module: "Module Three",
        pages: "Pages 12-16",
        color: "var(--topic-patrol_procedures)",
        icon: "🔦",
        summary: "Best practices for conducting foot and vehicle patrols, avoiding complacency, and maintaining situational awareness.",
        keyConcepts: [
            {
                title: "Benefits of Foot Patrol",
                excerpt: "Conducting your patrol on foot allows you to use all of your senses, and makes it easier for you to stay close to the persons or property... you are able to access secluded areas, such as stairwells.",
                section: "Alberta Security Manual",
            },
            {
                title: "The Danger of Complacency",
                excerpt: "Being complacent means you make a lot of assumptions based on prior experience... it causes you to miss real signs of trouble.",
                section: "Alberta Security Manual",
            },
            {
                title: "Night Patrol Tactics",
                excerpt: "When approaching an unknown situation at night, consider your stance with respect to the light; try not to create a silhouette of yourself, as it will make you readily visible.",
                section: "Alberta Security Manual",
            }
        ]
    },
    {
        id: "emergency_response",
        title: "Emergency Response",
        module: "Module Six",
        pages: "Pages 10-15",
        color: "var(--topic-emergency_response)",
        icon: "🚨",
        summary: "Protocols for handling fires, bomb threats, and other critical incidents while prioritizing safety and containment.",
        keyConcepts: [
            {
                title: "Fire Response Priority",
                excerpt: "If you discover a fire has started, you should immediately activate the fire alarm. Check the area for occupants and clear all persons from the building immediately. Closing doors helps prevent spread.",
                section: "Alberta Security Manual",
            },
            {
                title: "Using Extinguishers (PASS)",
                excerpt: "To use a fire extinguisher, follow the PASS method. PULL the pin. AIM the nozzle at the base. SQUEEZE the handle. SWEEP from side to side.",
                section: "Alberta Security Manual",
            },
            {
                title: "Bomb Threat Protocol",
                excerpt: "You must treat every bomb threat as a real and very serious situation. Listen, remain calm, be polite, do not interrupt, obtain as much information as possible, and notify your supervisor or police.",
                section: "Alberta Security Manual",
            }
        ]
    }
];
