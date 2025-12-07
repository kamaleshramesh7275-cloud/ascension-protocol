// Simplified beta access - no Firebase dependency
// Codes are validated server-side only

const VALID_CODES = new Set([
    "AP-BETA-X7K9M2",
    "AP-BETA-P4N8Q1",
    "AP-BETA-R5T6Y3",
    "AP-BETA-W2E9L7",
    "AP-BETA-Z8H4J6",
    "AP-BETA-C3V5B1",
    "AP-BETA-M9N2K8",
    "AP-BETA-F7G4D5",
    "AP-BETA-S6A3Q9",
    "AP-BETA-L1P8R4"
]);

export const validateBetaCode = async (code: string): Promise<boolean> => {
    if (!code) return false;

    // Simple validation - check if code is in the valid set
    return VALID_CODES.has(code);
};

export const claimBetaCode = async (code: string, userId: string): Promise<boolean> => {
    // For now, just validate the code
    // In production, you'd track claimed codes in a database
    return VALID_CODES.has(code);
};

export const checkUserBetaAccess = async (userId: string): Promise<boolean> => {
    // Always return true for now - beta code is stored in user profile
    return true;
};

// Dummy exports for admin panel compatibility
export interface BetaCode {
    code: string;
    claimedBy: string | null;
    createdAt: any;
    claimedAt: any | null;
    isUsed: boolean;
}

export const getAllBetaCodes = async (): Promise<BetaCode[]> => {
    return Array.from(VALID_CODES).map(code => ({
        code,
        claimedBy: null,
        createdAt: new Date(),
        claimedAt: null,
        isUsed: false
    }));
};

export const generateBetaCodes = async (count: number = 10) => {
    const newCodes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = `AP-BETA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        VALID_CODES.add(code);
        newCodes.push(code);
    }
    return newCodes;
};

export const resetBetaCode = async (code: string) => {
    // No-op for now
    return;
};
