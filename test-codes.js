// Quick test codes - paste these into your browser console on the beta-access page
// Or use the admin panel to generate codes

const testCodes = [
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
];

// To manually add these to Firestore, run this in browser console:
async function addTestCodes() {
    const { db } = await import('./client/src/lib/firebase.ts');
    const { doc, setDoc, Timestamp } = await import('firebase/firestore');

    for (const code of testCodes) {
        await setDoc(doc(db, 'betaAccessCodes', code), {
            code,
            claimedBy: null,
            createdAt: Timestamp.now(),
            claimedAt: null,
            isUsed: false
        });
        console.log(`Added: ${code}`);
    }
    console.log('✅ All test codes added!');
}

// Or simply use one of these codes in the beta-access page:
console.log('Test Beta Codes:', testCodes);
