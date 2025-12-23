// @ts-nocheck
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { getAuthOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

async function handler(req: NextRequest, ctx: any) {
    return NextAuth(req, ctx, getAuthOptions(req));
}

export { handler as GET, handler as POST };
