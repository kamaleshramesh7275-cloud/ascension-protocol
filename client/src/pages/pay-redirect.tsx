
import { useEffect } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentRedirect() {
    const upiLink = "upi://pay?pa=6383525774@ptaxis&pn=KamaleshkumarRameshkumar&am=100";

    useEffect(() => {
        // Attempt redirect immediately
        const timer = setTimeout(() => {
            window.location.href = upiLink;
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Redirecting to Payment...</h1>
            <p className="text-zinc-400 mb-8 max-w-md">
                Opening your UPI app. If it doesn't open automatically, click the button below.
            </p>

            <a href={upiLink} className="w-full max-w-sm">
                <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold h-12">
                    Click here to Pay ₹100 <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </a>

            <p className="text-xs text-zinc-600 mt-8">
                Official Payment Gateway: Kamaleshkumar Rameshkumar
            </p>
        </div>
    );
}
