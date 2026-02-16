
import { ReactNode } from "react";

interface TestSectionProps {
    title: string;
    children: ReactNode;
}

export function TestSection({ title, children }: TestSectionProps) {
    return (
        <section className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
            <div className="space-y-4">
                {children}
            </div>
        </section>
    );
}
