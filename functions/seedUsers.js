#!/usr/bin/env node
//
// functions/seedUsers.js
// Script de “seeding” para criar 5 usuários no Auth + perfis no Firestore (emuladores).
// – 2 admins
// – 3 users “normais”
//
// Uso:
// 1) Inicie os emuladores: firebase emulators:start
// 2) Em outro terminal, na raiz do projeto: node functions/seedUsers.js
//

// 1) Aponte este processo para os emuladores
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST     = 'localhost:8080';
process.env.GCLOUD_PROJECT               = 'licheskis-cook-assintant';

const { admin, db } = require('./firebaseAdmin');
const FieldValue    = admin.firestore.FieldValue;
const Timestamp     = admin.firestore.Timestamp;

(async () => {
  const users = [
    {
      email: 'admin1@test.com',
      password: 'pass123',
      displayName: 'Admin One',
      role: 'admin',
      preferences: { dietary_restrictions: [], calorie_target: 2000 },
      hormonal_cycle: {
        start_date:       Timestamp.fromDate(new Date(Date.now() - 4 * 24*60*60*1000)),
        cycle_length:     28, menstrual_length: 5,
        follicular_length:13, ovulatory_length: 1,
        midluteal_length: 7, lateluteal_length: 2
      }
    },
    {
      email: 'admin2@test.com',
      password: 'pass123',
      displayName: 'Admin Two',
      role: 'admin',
      preferences: { dietary_restrictions: ['gluten_free'], calorie_target: 1800 },
      hormonal_cycle: {
        start_date:       Timestamp.fromDate(new Date(Date.now() - 7 * 24*60*60*1000)),
        cycle_length:     30, menstrual_length: 4,
        follicular_length:14, ovulatory_length: 1,
        midluteal_length: 8, lateluteal_length: 3
      }
    },
    {
      email: 'user1@test.com',
      password: 'pass123',
      displayName: 'User One',
      role: 'user',
      preferences: { dietary_restrictions: ['vegetarian'], calorie_target: 2000 },
      hormonal_cycle: {
        start_date:       Timestamp.fromDate(new Date(Date.now() - 10*24*60*60*1000)),
        cycle_length:     26, menstrual_length: 6,
        follicular_length:12, ovulatory_length: 1,
        midluteal_length: 6, lateluteal_length: 3
      }
    },
    {
      email: 'user2@test.com',
      password: 'pass123',
      displayName: 'User Two',
      role: 'user',
      preferences: { dietary_restrictions: ['vegan'], calorie_target: 2200 },
      hormonal_cycle: {
        start_date:       Timestamp.fromDate(new Date(Date.now() - 14*24*60*60*1000)),
        cycle_length:     28, menstrual_length: 5,
        follicular_length:13, ovulatory_length: 1,
        midluteal_length: 7, lateluteal_length: 2
      }
    },
    {
      email: 'user3@test.com',
      password: 'pass123',
      displayName: 'User Three',
      role: 'user',
      preferences: { dietary_restrictions: [], calorie_target: 2500 },
      hormonal_cycle: {
        start_date:       Timestamp.fromDate(new Date(Date.now() - 20*24*60*60*1000)),
        cycle_length:     32, menstrual_length: 7,
        follicular_length:14, ovulatory_length: 1,
        midluteal_length: 8, lateluteal_length: 2
      }
    },
  ];

  for (const u of users) {
    // Cria no Auth Emulator
    const { uid } = await admin.auth().createUser({
      email:         u.email,
      emailVerified: true,
      password:      u.password,
      displayName:   u.displayName,
      disabled:      false
    });
    console.log(`✓ Auth user created: ${u.email} → ${uid}`);

    // Custom claim para admins
    if (u.role === 'admin') {
      await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
      console.log('  └─ custom claim “role: admin” set');
    }

    // Perfil no Firestore
    await db.collection('users').doc(uid).set({
      id:             uid,
      email:          u.email,
      display_name:   u.displayName,
      role:           u.role,
      preferences:    u.preferences,
      hormonal_cycle: {
        ...u.hormonal_cycle,
        updated_at: FieldValue.serverTimestamp()
      },
      created_at:     FieldValue.serverTimestamp(),
      updated_at:     FieldValue.serverTimestamp()
    });
    console.log(`  └─ Firestore profile created with role="${u.role}"\n`);
  }

  console.log('✔ All seed users created.');
  process.exit(0);
})();
