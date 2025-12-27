import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware para proteger endpoints de testing
 * Requiere un token de autenticación en el header Authorization
 */
export function requireTestAuth(request: NextRequest): NextResponse | null {
    // En desarrollo, permitir sin autenticación
    if (process.env.NODE_ENV === 'development') {
        return null; // Continuar sin restricción
    }

    // En producción, requerir token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.TEST_API_TOKEN;

    if (!expectedToken) {
        console.error('[TestAuth] TEST_API_TOKEN not configured');
        return NextResponse.json(
            { error: 'Test endpoints not configured' },
            { status: 503 }
        );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        console.warn('[TestAuth] Unauthorized test endpoint access attempt');
        return NextResponse.json(
            { error: 'Unauthorized - Invalid or missing test token' },
            { status: 401 }
        );
    }

    // Token válido, permitir continuar
    return null;
}
