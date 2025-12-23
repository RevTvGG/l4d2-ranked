// @ts-nocheck
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { getAuthOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

const handler = async (req: NextRequest, ctx: any): Promise<any> => {
    return NextAuth(req, ctx, getAuthOptions(req));
};

export const GET = handler as any;
export const POST = handler as any;
