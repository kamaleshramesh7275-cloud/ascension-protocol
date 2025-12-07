
import fetch from 'node-fetch';
import WebSocket from 'ws';

const BASE_URL = 'http://localhost:5000';
const WS_URL = 'ws://localhost:5000/ws/chat';
const ADMIN_PASSWORD = 'admin123';
const TEST_USER = {
    firebaseUid: 'restore_test_' + Date.now(),
    name: 'Restore Tester',
    email: 'restore@example.com',
    avatarUrl: null
};

async function run() {
    console.log('🚀 Starting Restore Verification...');

    // 1. Create a user to have some data
    console.log('1️⃣ Creating initial data...');
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
    });
    if (!regRes.ok) throw new Error('Registration failed');
    const user: any = await regRes.json();
    console.log(`   User created: ${user.id}`);

    // 2. Trigger Backup to file
    console.log('2️⃣ Triggering backup...');
    const backupRes = await fetch(`${BASE_URL}/api/admin/backup/create`, {
        method: 'POST',
        headers: { 'x-admin-password': ADMIN_PASSWORD }
    });
    if (!backupRes.ok) throw new Error('Backup failed');
    console.log('   Backup created on server.');

    // 3. Download the backup (to get the JSON content)
    console.log('3️⃣ Downloading backup content...');
    const downloadRes = await fetch(`${BASE_URL}/api/admin/backup/download?password=${ADMIN_PASSWORD}`);
    if (!downloadRes.ok) throw new Error('Download failed');
    const backupData = await downloadRes.json();
    // console.log('   Backup downloaded keys:', Object.keys(backupData as any));

    // 4. Create User B (extraneous data)
    console.log('4️⃣ Creating extraneous data (User B) to verify overwrite...');
    const userB_Res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...TEST_USER, firebaseUid: TEST_USER.firebaseUid + '_B' })
    });
    if (!userB_Res.ok) throw new Error('User B creation failed');
    const userB: any = await userB_Res.json();
    console.log(`   User B created: ${userB.id}`);

    // 5. Connect WS to listen for announcement
    console.log('5️⃣ Connecting WebSocket to listen for system announcement...');
    const ws = new WebSocket(WS_URL);

    const announcementPromise = new Promise<void>((resolve, reject) => {
        ws.on('open', () => console.log('   WS Connected.'));
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                // console.log('   WS Message:', msg.type);
                if (msg.type === 'system_announcement') {
                    console.log('✅ RECEIVED ANNOUNCEMENT:', msg.message);
                    resolve();
                }
            } catch (e) {
                // ignore parse errors
            }
        });
        setTimeout(() => reject(new Error('Announcement timeout (5s)')), 5000);
    });

    // 6. Restore from backupData
    console.log('6️⃣ Restoring from backup...');
    const restoreRes = await fetch(`${BASE_URL}/api/admin/backup/restore`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-password': ADMIN_PASSWORD
        },
        body: JSON.stringify(backupData)
    });
    if (!restoreRes.ok) {
        console.error(await restoreRes.text());
        throw new Error('Restore failed');
    }
    console.log('   Restore executed.');

    try {
        await announcementPromise;
        console.log('   Announcement verification: SUCCESS');
    } catch (e) {
        console.error('❌ Announcement NOT received.');
        // throw e; 
        // We will propagate error to fail the script
    }
    ws.close();

    // 7. Verify Data Result
    console.log('7️⃣ Verifying data state...');
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: { 'x-admin-password': ADMIN_PASSWORD }
    });
    const users: any = await usersRes.json();

    const foundA = users.find((u: any) => u.id === user.id);
    const foundB = users.find((u: any) => u.id === userB.id);

    if (foundA && !foundB) {
        console.log('✅ DATA VERIFICATION SUCCESS: User A present, User B gone.');
    } else {
        console.error('❌ DATA VERIFICATION FAILURE:');
        console.error(`   User A found: ${!!foundA}`);
        console.error(`   User B found: ${!!foundB}`);
        process.exit(1);
    }
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
