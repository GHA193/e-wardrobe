"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import translations from "@/lib/i18n";
import s from "./page.module.css";

export default function LoginPage() {
    const router = useRouter();
    const [isSetup, setIsSetup] = useState(false);
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get saved language or default to zh
    const [locale, setLocale] = useState("zh");

    useEffect(() => {
        const savedLang = localStorage.getItem("e-wardrobe-locale");
        if (savedLang === "en" || savedLang === "zh") setLocale(savedLang);

        // Check system status
        fetch("/api/auth/status")
            .then(res => res.json())
            .then(data => {
                setIsSetup(!data.initialized);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to connect to server");
                setLoading(false);
            });
    }, []);

    // Sync back to local storage when changed
    useEffect(() => {
        localStorage.setItem("e-wardrobe-locale", locale);
    }, [locale]);

    const t = (key) => translations[locale]?.[key] || translations.en[key] || key;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        if (isSetup && password !== confirmPassword) {
            setError(t("passwordsDoNotMatch"));
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const endpoint = isSetup ? "/api/auth/setup" : "/api/auth/login";
            const bodyPayload = { username, password };
            if (isSetup) bodyPayload.confirmPassword = confirmPassword;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t(isSetup ? "setupError" : "authError"));
            }

            // Success, redirect to home
            router.push("/");
            router.refresh(); // Refresh app to ensure middleware sync

        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className={s.container}>
            <div className={s.authCard}>
                <button
                    className={`btn btn-ghost ${s.langToggle}`}
                    onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
                    title={locale === "zh" ? "Switch to English" : "切换为中文"}
                >
                    {t("langToggle")}
                </button>
                <div className={s.logoArea}>
                    <div className={s.logoIcon}>👗</div>
                    <h1 className={s.title}>{isSetup ? t("setupTitle") : t("loginTitle")}</h1>
                </div>

                {error && <div className={s.error}>{error}</div>}

                <form className={s.form} onSubmit={handleSubmit}>
                    <div className={s.formGroup}>
                        <label className={s.label}>{t("username")}</label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className={s.formGroup}>
                        <label className={s.label}>{t("password")}</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isSetup && (
                        <div className={s.formGroup}>
                            <label className={s.label}>{t("confirmPassword")}</label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <div className={s.hint}>{t("passwordRequirement")}</div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`btn btn-primary ${s.submitBtn}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "..." : (isSetup ? t("setupBtn") : t("loginBtn"))}
                    </button>
                </form>
            </div>
        </div>
    );
}
