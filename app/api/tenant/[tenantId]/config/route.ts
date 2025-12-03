import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to fetch Firebase config for a specific tenant
 * 
 * Security: This should be protected and only return public Firebase config
 * (apiKey, authDomain, etc. are safe to expose - they're client-side anyway)
 */

// OPTION 1: Store configs in database (RECOMMENDED for production)
// You would fetch from your database based on tenantId

// OPTION 2: Store configs in environment variables
// Format: TENANT_{TENANTID}_FIREBASE_API_KEY
function getConfigFromEnv(tenantId: string) {
  const prefix = `TENANT_${tenantId.toUpperCase()}_FIREBASE_`;
  
  return {
    apiKey: process.env[`${prefix}API_KEY`],
    authDomain: process.env[`${prefix}AUTH_DOMAIN`],
    projectId: process.env[`${prefix}PROJECT_ID`],
    storageBucket: process.env[`${prefix}STORAGE_BUCKET`],
    messagingSenderId: process.env[`${prefix}MESSAGING_SENDER_ID`],
    appId: process.env[`${prefix}APP_ID`],
  };
}

// OPTION 3: Store configs in a secure configuration file
const TENANT_CONFIGS: Record<string, any> = {
  'default': {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  // Add your client configs here
  'demo': {
    apiKey: process.env.NEXT_PUBLIC_DEMO_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_DEMO_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_DEMO_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_DEMO_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_DEMO_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_DEMO_FIREBASE_APP_ID,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const tenantId = params.tenantId;

  // Validate tenant ID (prevent path traversal, etc.)
  if (!tenantId || !/^[a-z0-9-]+$/.test(tenantId)) {
    return NextResponse.json(
      { error: 'Invalid tenant ID' },
      { status: 400 }
    );
  }

  // TODO: In production, you should:
  // 1. Verify the request is authorized
  // 2. Fetch config from your database
  // 3. Log access for security monitoring

  // Get config (choose one of the options above)
  const config = TENANT_CONFIGS[tenantId]; // Option 3
  // const config = getConfigFromEnv(tenantId); // Option 2
  // const config = await fetchConfigFromDatabase(tenantId); // Option 1

  if (!config || !config.apiKey) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // Return the Firebase config
  return NextResponse.json(config);
}

// Example: Fetch from database (implement based on your setup)
// async function fetchConfigFromDatabase(tenantId: string) {
//   const prisma = new PrismaClient();
//   const tenant = await prisma.tenant.findUnique({
//     where: { id: tenantId },
//     select: {
//       firebaseApiKey: true,
//       firebaseAuthDomain: true,
//       firebaseProjectId: true,
//       firebaseStorageBucket: true,
//       firebaseMessagingSenderId: true,
//       firebaseAppId: true,
//     },
//   });
//   
//   return {
//     apiKey: tenant?.firebaseApiKey,
//     authDomain: tenant?.firebaseAuthDomain,
//     projectId: tenant?.firebaseProjectId,
//     storageBucket: tenant?.firebaseStorageBucket,
//     messagingSenderId: tenant?.firebaseMessagingSenderId,
//     appId: tenant?.firebaseAppId,
//   };
// }
