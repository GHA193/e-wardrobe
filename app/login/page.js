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
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get saved language or default to zh
    const [locale, setLocale] = useState("zh");

    useEffect(() => {
        const savedLang = localStorage.getItem("ew_lang");
        if (savedLang) setLocale(savedLang);

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

    const t = (key) => translations[locale]?.[key] || translations.en[key] || key;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        setIsSubmitting(true);
        setError("");

        try {
            const endpoint = isSetup ? "/api/auth/setup" : "/api/auth/login";
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
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
                        {isSetup && <div className={s.hint}>{t("passwordRequirement")}</div>}
                    </div>

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
