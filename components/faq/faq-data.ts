export type ContentLang = "en" | "es";

export interface FAQEntry {
    [key: string]: {
        title: string;
        content: React.ReactNode;
    }
}
// Note: We will store text strings here. For the React content, we will map it in the component 
// to avoid huge file bloat or complex string parsing, OR we construct the objects in the component.
// Storing pure text strings for titles/labels is best here.

export const FAQ_LABELS = {
    en: {
        nav: {
            back: "← Back to Home",
            general: "General",
            requirements: "Requirements",
            howToPlay: "How to Play",
            mmr: "MMR System",
            profiles: "Profiles & Teams",
            teamRules: "Team Rules",
            staff: "Meet the Team",
            support: "Support",
            bans: "Ban Policy",
            premium: "Premium & Refunds",
            credits: "Credits"
        },
        hero: {
            title: "Help & FAQ",
            subtitle: "Everything you need to know about L4D2 Ranked."
        },
        beta: {
            title: "Platform in BETA",
            desc: "L4D2 Ranked is currently under active development. You may experience bugs, connection issues, or incomplete features. We appreciate your patience!",
            footer: "Thanks for helping us improve."
        }
    },
    es: {
        nav: {
            back: "← Volver al Inicio",
            general: "General",
            requirements: "Requisitos",
            howToPlay: "Cómo Jugar",
            mmr: "Sistema MMR",
            profiles: "Perfiles y Equipos",
            teamRules: "Reglas de Equipos",
            staff: "Nuestro Equipo",
            support: "Soporte",
            bans: "Política de Baneos",
            premium: "Premium y Reembolsos",
            credits: "Créditos"
        },
        hero: {
            title: "Ayuda y FAQ",
            subtitle: "Todo lo que necesitas saber sobre L4D2 Ranked."
        },
        beta: {
            title: "Plataforma en BETA",
            desc: "L4D2 Ranked está actualmente en desarrollo activo. Puedes experimentar errores, problemas de conexión o funciones incompletas. ¡Agradecemos tu paciencia!",
            footer: "Gracias por ayudarnos a mejorar."
        }
    }
}
