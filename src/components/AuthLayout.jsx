export default function AuthLayout({ children, className = 'max-w-[480px]'}) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12 text-text">
            <div
                aria-hidden="true"
                className="absolute -left-64 -top-72 h-[700px] w-[860px] rounded-[48%_52%_66%_34%/58%_46%_54%_42%] bg-brand"
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-80 -right-72 h-[700px] w-[940px] rounded-[60%_40%_48%_52%/52%_58%_42%_48%] bg-brand"
            />
            <main
                className={`relative w-full rounded-[32px] bg-white px-6 py-10 shadow-[0_30px_80px_rgba(107,68,35,0.22)] sm:px-11 sm:py-12 ${className}`}
            >
                {children}
            </main>
        </div>
    )
}