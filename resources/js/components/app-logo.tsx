export default function AppLogo() {
    return (
        <div className="flex items-center">
            <img
                src="/logo/Logo1.svg"
                alt="Logo"
                className="h-8 dark:hidden"
            />
            <img
                src="/logo/Logo1-darkmode.svg"
                alt="Logo"
                className="h-8 hidden dark:block"
            />
        </div>
    );
}
