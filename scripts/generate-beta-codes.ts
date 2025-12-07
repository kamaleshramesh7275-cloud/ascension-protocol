import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCG6MOlkw0EREki69YhwA2qm1I0EmrTQAI",
    authDomain: "ascension-957b6.firebaseapp.com",
    projectId: "ascension-957b6",
    storageBucket: "ascension-957b6.firebasestorage.app",
    appId: "1:1077180336436:web:23631ba82fc1100b03bd61",
    messagingSenderId: "1077180336436",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateBetaCodes(count: number = 100) {
    console.log(`Generating ${count} beta access codes...`);

    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
        const code = `AP-BETA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const codeRef = doc(db, "betaAccessCodes", code);

        await setDoc(codeRef, {
            code,
            claimedBy: null,
            createdAt: Timestamp.now(),
            claimedAt: null,
            isUsed: false
        });

        codes.push(code);
        console.log(`Generated: ${code}`);
    }

    console.log(`\n✅ Successfully generated ${count} beta codes!`);
    console.log("\nSample codes:");
    codes.slice(0, 10).forEach(code => console.log(`  - ${code}`));

    process.exit(0);
}

generateBetaCodes(100).catch(console.error);
