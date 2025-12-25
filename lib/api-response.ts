
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ApiError = {
    error: string;
    code: string;
    details?: any;
};

export type ApiSuccess<T> = {
    success: true;
    data: T;
};

/**
 * Standard Success Response (200 OK)
 * @param data Typed data payload
 */
export function successResponse<T>(data: T) {
    return NextResponse.json({
        success: true,
        data
    }, { status: 200 });
}

/**
 * Standard Error Response
 * @param message Human readable error
 * @param code Internal error code (e.g. 'UNAUTHORIZED')
 * @param status HTTP Status (default 400, or 500)
 */
export function errorResponse(message: string, code: string = 'BAD_REQUEST', status: number = 400) {
    return NextResponse.json({
        success: false,
        error: message,
        code
    }, { status });
}

/**
 * Zod Validation Error Response (400 Bad Request)
 */
export function validationError(error: ZodError) {
    return NextResponse.json({
        success: false,
        error: 'Validation Failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
    }, { status: 400 });
}

/**
 * Unauthorized Response (401)
 */
export function unauthorizedResponse() {
    return errorResponse('Invalid or missing server key', 'UNAUTHORIZED', 401);
}
