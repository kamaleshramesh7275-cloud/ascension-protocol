import { useEffect } from "react";
import { useLocation, useParams } from "wouter";

// This page handles /ref/:code links
// It saves the referral code to localStorage and redirects to /register
export default function ReferralRedirect() {
    const { code } = useParams<{ code: string }>();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (code) {
            localStorage.setItem("referral_code", code.toUpperCase());
        }
        setLocation("/register");
    }, [code, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-center space-y-3">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-zinc-400 text-sm">Redirecting to registration...</p>
            </div>
        </div>
    );
}
