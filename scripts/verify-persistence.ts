
import WebSocket from 'ws';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws/chat';
const ADMIN_PASSWORD = 'admin123'; // Default from auth.ts
const TEST_USER = {
    firebaseUid: 'test_persist_user_' + Date.now(),
    name: 'Persistence Tester',
    email: 'tester@example.com',
    avatarUrl: 'https://github.com/shadcn.png'
};

const MODE = process.argv[2]; // 'setup' or 'verify'

async function setup() {
    console.log('🚀 Starting Persistence Setup...');

    // 1. Register User
    console.log('👤 Registering User...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });

    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.statusText}`);
    const user = await regRes.json();
    console.log(`✅ User created: ${user.id}`);

    // 2. Send Chat Message via WebSocket
    console.log('💬 Connecting to WebSocket...');
    const ws = new WebSocket(WS_URL);

    await new Promise<void>((resolve, reject) => {
        ws.on('open', async () => {
            console.log('✅ Connected. Sending "hi"...');

            const msg = {
                userId: user.id, // Schema expects userId
                content: 'hi',
                user: user // Some implementations might expect user object, but schema usually just ID for foreign key. 
                // Let's check schema if strict. usually client sends { content, ... } and server expects specific format.
                // Server routes.ts: JSON.parse(data) -> createMessage(parseResult.data)
                // We need to match insertMessageSchema.
            };

            // Let's look at schema assumption: userId and content are likely required.
            ws.send(JSON.stringify(msg));
        });

        ws.on('message', (data) => {
            const response = JSON.parse(data.toString());
            if (response.type === 'new_message' && response.message.content === 'hi') {
                console.log('✅ Message "hi" received back (confirmed sent).');
                ws.close();
                resolve();
            }
        });

        ws.on('error', reject);

        // Timeout
        setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // 3. Trigger Backup
    console.log('💾 Triggering Admin Backup...');
    const backupRes = await fetch(`${BASE_URL}/api/admin/backup/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': ADMIN_PASSWORD
        }
    });

    if (!backupRes.ok) throw new Error(`Backup failed: ${backupRes.statusText}`);
    const backupData = await backupRes.json();
    console.log(`✅ Backup response: ${JSON.stringify(backupData)}`);

    console.log('🎉 Setup Complete. Now restart the server.');
}

async function verify() {
    console.log('🔍 Starting Verification...');

    // Fetch messages
    const res = await fetch(`${BASE_URL}/api/messages`);
    if (!res.ok) throw new Error(`Fetch messages failed: ${res.statusText}`);

    const messages = await res.json();
    const hiMessage = messages.find(m => m.content === 'hi');

    if (hiMessage) {
        console.log('✅ Found message "hi" in history!');
        console.log('Message Details:', hiMessage);
        console.log('SUCCESS: Persistence verified.');
    } else {
        console.error('❌ Message "hi" NOT found.');
        console.log('Recent messages:', messages.slice(0, 5));
        process.exit(1);
    }
}

// Run
if (MODE === 'setup') {
    setup().catch(e => { console.error(e); process.exit(1); });
} else if (MODE === 'verify') {
    verify().catch(e => { console.error(e); process.exit(1); });
} else {
    console.log('Usage: tsx scripts/verify-persistence.ts [setup|verify]');
}
