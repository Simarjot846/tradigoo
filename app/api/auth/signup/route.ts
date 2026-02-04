import { createClient, createServiceClient, createClientWithCookieCollector } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, userData } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { supabase, cookieActions } = createClientWithCookieCollector();
    const supabaseAdmin = createServiceClient();

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 } // Or appropriate auth error status
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Signup failed to return user data' },
        { status: 500 }
      );
    }

    // Check if profile already exists to avoid SQL errors or duplicates
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'User already registered with this email' },
        { status: 409 }
      );
    }

    // 2. Create the user profile using Service Role (bypassing RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: userData.role || 'retailer',
        name: userData.name || '',
        phone: userData.phone || null,
        business_name: userData.business_name || '',
        location: userData.location || '',
        trust_score: 500,
        total_orders: 0,
        successful_orders: 0,
        disputed_orders: 0,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Optional: Delete the auth user if profile creation fails to maintain consistency
      // await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Build response and apply cookies recorded by the Supabase client
    const response = NextResponse.json({
      user: authData.user,
      message: 'Account created successfully'
    });

    // Apply any Set-Cookie actions collected during the signup call
    if (cookieActions && cookieActions.length) {
      for (const action of cookieActions) {
        try {
          response.cookies.set({
            name: action.name,
            value: action.value,
            ...(action.options || {}),
          });
        } catch (e) {
          // ignore cookie set failures but log in case of debugging
          console.warn('Failed to apply cookie action', action.name, e);
        }
      }
    }

    return response;

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
