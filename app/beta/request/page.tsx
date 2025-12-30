"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { submitBetaRequest } from "@/app/actions/betaRequest";
import {
    Loader2, Send, Globe, HelpCircle,
    CheckCircle, AlertCircle, Sparkles,
    ExternalLink, Users, Shield, MessageSquare
} from "lucide-react";
import Link from "next/link";

// Translations
const translations = {
    en: {
        title: "Beta Access Request",
        subtitle: "Thank you for your interest in participating in the beta. Our site is currently looking for new players while our server infrastructure continues to grow. Please fill out this questionnaire.",
        note: "This does not guarantee beta access, but you may be selected for access.",
        steamLabel: "Your Steam ID or Steam Profile URL",
        steamHelp: "Need help finding your Steam ID?",
        discordLabel: "Your Discord (optional)",
        discordPlaceholder: "username#0000 or username",
        countryLabel: "What country are you from?",
        countryPlaceholder: "Select your country...",
        communityLabel: "Do you play in any other competitive community?",
        communityPlaceholder: "e.g., cedapug, l4d2center...",
        authLabel: "Would you agree to use two-factor authentication (e.g., phone verification) if required?",
        authYes: "Yes, I agree",
        authNo: "No, I would not",
        heardLabel: "How did you hear about the site?",
        heardPlaceholder: "e.g., Discord, friend, YouTube, Reddit...",
        whyLabel: "Why are you interested in participating in the beta?",
        whyPlaceholder: "Tell us about your experience with L4D2 and what you expect from ranked matchmaking...",
        submit: "Submit Request",
        submitting: "Submitting...",
        backToVerify: "I already have an invite code",
        successTitle: "Request Submitted!",
        successMessage: "Thank you for your information. You have a higher chance of being selected. We'll contact you via Discord if you're chosen.",
        errorDuplicate: "You have already submitted a request.",
        required: "Required field"
    },
    es: {
        title: "Solicitud de Acceso Beta",
        subtitle: "Gracias por tu interés en participar en la beta. Actualmente el sitio se encuentra buscando nuevos jugadores mientras nuestra infraestructura de servidores sigue creciendo. Por favor rellena este cuestionario.",
        note: "Esto no te garantiza tener acceso a la beta, pero puede que seas sorteado para obtener acceso.",
        steamLabel: "Tu Steam ID o URL de tu perfil de Steam",
        steamHelp: "¿Necesitas ayuda para encontrar tu Steam ID?",
        discordLabel: "Tu Discord (opcional)",
        discordPlaceholder: "usuario#0000 o usuario",
        countryLabel: "¿De qué país eres?",
        countryPlaceholder: "Selecciona tu país...",
        communityLabel: "¿Juegas en alguna otra comunidad competitiva?",
        communityPlaceholder: "e.g., cedapug, l4d2center...",
        authLabel: "¿Estarías de acuerdo si en algún punto tendrías que usar un método de doble autenticación como vincular un número de teléfono?",
        authYes: "Sí, estoy de acuerdo",
        authNo: "No, no estaría de acuerdo",
        heardLabel: "¿Cómo te enteraste del sitio web?",
        heardPlaceholder: "ej: Discord, amigo, YouTube, Reddit...",
        whyLabel: "¿Por qué tienes interés en participar en la beta?",
        whyPlaceholder: "Cuéntanos sobre tu experiencia con L4D2 y qué esperas del matchmaking rankeado...",
        submit: "Enviar Solicitud",
        submitting: "Enviando...",
        backToVerify: "Ya tengo un código de invitación",
        successTitle: "¡Solicitud Enviada!",
        successMessage: "Gracias por tus datos. Tienes más probabilidades de ser seleccionado. Te contactaremos por Discord si eres elegido.",
        errorDuplicate: "Ya has enviado una solicitud.",
        required: "Campo requerido"
    }
};

const countries = [
    "Argentina", "Australia", "Bolivia", "Brasil", "Canada", "Chile", "China", "Colombia", "Costa Rica",
    "Cuba", "Dominican Republic", "Ecuador", "El Salvador", "France", "Germany", "Guatemala", "Honduras",
    "India", "Indonesia", "Italy", "Japan", "Mexico", "Nicaragua", "Panama", "Paraguay", "Peru",
    "Philippines", "Poland", "Puerto Rico", "Russia", "South Korea", "Spain", "Sweden", "Thailand",
    "Turkey", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam", "Other"
];

export default function BetaRequestPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [lang, setLang] = useState<"en" | "es">("es");
    const t = translations[lang];

    const [form, setForm] = useState({
        steamId: "",
        discord: "",
        country: "",
        otherCommunity: "",
        agreesWith2FA: true,
        howHeardAbout: "",
        whyInterested: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.steamId || !form.country || !form.howHeardAbout || !form.whyInterested) {
            setError(t.required);
            return;
        }

        setLoading(true);
        setError("");

        const result = await submitBetaRequest({
            steamId: form.steamId,
            steamUrl: form.steamId.includes("steam") ? form.steamId : undefined,
            discord: form.discord || undefined,
            country: form.country,
            otherCommunity: form.otherCommunity || undefined,
            agreesWith2FA: form.agreesWith2FA,
            howHeardAbout: form.howHeardAbout,
            whyInterested: form.whyInterested,
            language: lang
        });

        if (result.success) {
            setSuccess(true);
        } else {
            setError(result.error || "Error");
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-32 pb-12 px-4">
            {/* Language Switcher */}
            <div className="fixed top-4 right-4 z-50">
                <button
                    onClick={() => setLang(lang === "en" ? "es" : "en")}
                    className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg hover:border-brand-green/50 transition-colors"
                >
                    <Globe className="w-4 h-4 text-brand-green" />
                    <span className="text-sm font-medium">
                        {lang === "en" ? "🇺🇸 EN" : "🇪🇸 ES"}
                    </span>
                </button>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 border border-brand-green/30 mb-6">
                        <Users className="w-8 h-8 text-brand-green" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
                        {t.title}
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-4">
                        {t.subtitle}
                    </p>
                    <div className="inline-flex items-center gap-2 text-amber-400/80 text-xs bg-amber-500/10 px-4 py-2 rounded-full">
                        <AlertCircle className="w-4 h-4" />
                        {t.note}
                    </div>
                </div>

                {success ? (
                    <div className="bg-brand-green/10 border border-brand-green rounded-2xl p-8 text-center animate-in zoom-in duration-300">
                        <CheckCircle className="w-16 h-16 text-brand-green mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-brand-green mb-2">{t.successTitle}</h2>
                        <p className="text-zinc-400 text-sm mb-6">{t.successMessage}</p>
                        <Link
                            href="/beta/verify"
                            className="inline-flex items-center gap-2 text-brand-green hover:underline"
                        >
                            {t.backToVerify}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">

                        {/* Steam ID */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-sm font-medium">
                                <span>{t.steamLabel} <span className="text-red-400">*</span></span>
                                <a
                                    href="https://steamid.io/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-brand-green text-xs hover:underline"
                                >
                                    <HelpCircle className="w-3 h-3" />
                                    {t.steamHelp}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </label>
                            <input
                                type="text"
                                value={form.steamId}
                                onChange={(e) => setForm({ ...form, steamId: e.target.value })}
                                placeholder="76561198113376372 or https://steamcommunity.com/id/..."
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-green/50 transition-all"
                                required
                            />
                        </div>

                        {/* Discord */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                                {t.discordLabel}
                            </label>
                            <input
                                type="text"
                                value={form.discord}
                                onChange={(e) => setForm({ ...form, discord: e.target.value })}
                                placeholder={t.discordPlaceholder}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-green/50 transition-all"
                            />
                        </div>

                        {/* Country */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.countryLabel} <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={form.country}
                                onChange={(e) => setForm({ ...form, country: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-green/50 transition-all"
                                required
                            >
                                <option value="">{t.countryPlaceholder}</option>
                                {countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Other Community */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.communityLabel}</label>
                            <input
                                type="text"
                                value={form.otherCommunity}
                                onChange={(e) => setForm({ ...form, otherCommunity: e.target.value })}
                                placeholder={t.communityPlaceholder}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-green/50 transition-all"
                            />
                        </div>

                        {/* 2FA Agreement */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="w-4 h-4 text-blue-400" />
                                {t.authLabel} <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, agreesWith2FA: true })}
                                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${form.agreesWith2FA
                                        ? 'bg-brand-green/20 border-brand-green text-brand-green'
                                        : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                                        }`}
                                >
                                    {t.authYes}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, agreesWith2FA: false })}
                                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${!form.agreesWith2FA
                                        ? 'bg-red-500/20 border-red-500 text-red-400'
                                        : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                                        }`}
                                >
                                    {t.authNo}
                                </button>
                            </div>
                        </div>

                        {/* How Heard */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.heardLabel} <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.howHeardAbout}
                                onChange={(e) => setForm({ ...form, howHeardAbout: e.target.value })}
                                placeholder={t.heardPlaceholder}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-green/50 transition-all"
                                required
                            />
                        </div>

                        {/* Why Interested */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.whyLabel} <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                value={form.whyInterested}
                                onChange={(e) => setForm({ ...form, whyInterested: e.target.value })}
                                placeholder={t.whyPlaceholder}
                                rows={4}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-brand-green/50 transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-green hover:bg-brand-green/90 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t.submitting}
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    {t.submit}
                                </>
                            )}
                        </button>

                        {/* Back to verify */}
                        <div className="text-center pt-4 border-t border-white/5">
                            <Link
                                href="/beta/verify"
                                className="text-zinc-500 text-xs hover:text-brand-green transition-colors"
                            >
                                {t.backToVerify}
                            </Link>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center gap-2 text-zinc-600 text-xs">
                        <Sparkles className="w-3 h-3" />
                        <span>L4D2 Ranked - Closed Beta</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
