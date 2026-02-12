"use server";

import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Common auth helper for server actions.
 * Creates a Supabase client, verifies the user session, and returns both.
 * Throws a standardized Error on auth failure.
 */
export async function requireUserClient(): Promise<{
    supabase: SupabaseClient;
    user: User;
}> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw authError ?? new Error("Not authenticated");
    }

    return { supabase, user };
}
