export function CyberGridBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Hex Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="hexGrid" x="0" y="0" width="50" height="43.4" patternUnits="userSpaceOnUse">
                        <path
                            d="M25 0 L50 14.43 L50 28.87 L25 43.3 L0 28.87 L0 14.43 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-primary"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hexGrid)" />
            </svg>

            {/* Radial Gradients */}
            <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_20%_0%,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
            <div className="absolute bottom-0 right-0 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_80%_80%,_var(--tw-gradient-stops))] from-accent/10 via-background to-background opacity-60" />

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] animate-[scan_8s_linear_infinite]" />
        </div>
    );
}
