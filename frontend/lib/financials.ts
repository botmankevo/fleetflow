import { apiFetch } from "./api";

export interface FinancialSettings {
    target_profit_rpm: number;
    warning_rpm: number;
    break_even_rpm: number;
}

const DEFAULT_SETTINGS: FinancialSettings = {
    target_profit_rpm: 1.60,
    warning_rpm: 1.19,
    break_even_rpm: 1.18
};

let cachedSettings: FinancialSettings | null = null;

export async function getFinancialSettings(): Promise<FinancialSettings> {
    if (cachedSettings) return cachedSettings;
    try {
        const settings = await apiFetch("/financials/settings");
        cachedSettings = settings;
        return settings;
    } catch (error) {
        console.warn("Failed to fetch financial settings, using defaults");
        return DEFAULT_SETTINGS;
    }
}

export function getRPMColorClass(rpm: number, settings: FinancialSettings = DEFAULT_SETTINGS) {
    if (rpm >= settings.target_profit_rpm) return 'text-green-600 font-bold';
    if (rpm >= settings.warning_rpm) return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
}

export function getRPMBadgeColor(rpm: number, settings: FinancialSettings = DEFAULT_SETTINGS) {
    if (rpm >= settings.target_profit_rpm) return 'bg-green-100 text-green-700 border-green-200';
    if (rpm >= settings.warning_rpm) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
}
