
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Toaster } from "react-hot-toast";
import { ReactNode } from "react";

interface TestLayoutProps {
    children: ReactNode;
}

export function TestLayout({ children }: TestLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                    Game Core Test UI
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Devnet</span>
                    <WalletMultiButton />
                </div>
            </nav>

            <main className="container mx-auto max-w-4xl p-6">
                {children}
            </main>

            <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
        </div>
    );
}
