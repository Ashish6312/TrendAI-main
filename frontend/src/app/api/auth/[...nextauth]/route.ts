import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { getApiUrl } from "@/config/api"

const handler = NextAuth({
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
  pages: {
    signIn: '/auth',
    error: '/auth', // Redirect errors back to auth page
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text", optional: true },
        isSignUp: { label: "Is Sign Up", type: "text", optional: true }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const apiUrl = getApiUrl();
        
        try {
          if (credentials.isSignUp === "true") {
            // Sign up flow
            if (!credentials.name) {
              console.error('❌ SIGNUP ERROR: Name missing in credentials');
              throw new Error("Name is required for sign up");
            }

            console.log(`🚀 SIGNUP ATTEMPT: ${credentials.email} via ${apiUrl}`);
            const signUpResponse = await fetch(`${apiUrl}/api/auth/signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                name: credentials.name
              }),
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(60000) // 60 second timeout for cold starts
            });
            
              if (!signUpResponse.ok) {
                const errorText = await signUpResponse.text();
                let errorMessage = "Sign up failed";
                
                // Detect Vercel Authentication / Protection page
                if (errorText.includes("Authentication Required") || errorText.includes("vercel-user-meta")) {
                  errorMessage = "Backend is protected by Vercel Authentication. Please disable 'Deployment Protection' in your Vercel project settings.";
                } else {
                  try {
                    const errorObj = JSON.parse(errorText);
                    errorMessage = errorObj.detail || errorMessage;
                  } catch (e) {
                    errorMessage = errorText.length > 100 ? "Sign up failed (Invalid response)" : errorText || errorMessage;
                  }
                }
                
                console.error(`❌ SIGNUP FAILED (${signUpResponse.status}):`, errorMessage);
                throw new Error(errorMessage);
              }

            const user = await signUpResponse.json();
            console.log('✅ SIGNUP SUCCESS:', { email: user.email, id: user.id });
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              image: user.image_url
            };
          } else {
            // Sign in flow
            console.log(`🚀 SIGNIN ATTEMPT: ${credentials.email} via ${apiUrl}`);
            const signInResponse = await fetch(`${apiUrl}/api/auth/signin`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password
              }),
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(60000) // 60 second timeout for cold starts
            });

              if (!signInResponse.ok) {
                const errorText = await signInResponse.text();
                let errorMessage = "Invalid email or password";
                
                // Detect Vercel Authentication / Protection page
                if (errorText.includes("Authentication Required") || errorText.includes("vercel-user-meta")) {
                  errorMessage = "Backend is protected by Vercel Authentication. Please disable 'Deployment Protection' in your Vercel project settings.";
                } else {
                  try {
                    const errorObj = JSON.parse(errorText);
                    errorMessage = errorObj.detail || errorMessage;
                  } catch (e) {
                    errorMessage = errorText.length > 100 ? "Sign in failed (Invalid response)" : errorText || errorMessage;
                  }
                }
                
                console.error(`❌ SIGNIN FAILED (${signInResponse.status}):`, errorMessage);
                throw new Error(errorMessage);
              }

            const user = await signInResponse.json();
            console.log('✅ SIGNIN SUCCESS:', { email: user.email, id: user.id });
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              image: user.image_url
            };
          }
        } catch (error: any) {
          console.error("Critical Auth error catch:", error.name, error.message);
          if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            throw new Error("Backend connection timed out. Is the API running?");
          }
          throw new Error(error.message || "Authentication failed");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Simplified sign-in callback - remove heavy operations
      if (user.email) {
        // Only do basic user sync, don't wait for it to complete
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscope-api.onrender.com';
        
        // Fire and forget - don't await this to speed up login
        fetch(`${apiUrl}/api/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            name: user.name || 'User',
            image_url: user.image 
          }),
          signal: AbortSignal.timeout(30000) // Increased to 30s
        }).catch(error => {
          console.error('Failed to sync user (non-blocking):', error);
        });
      }
      return true;
    },
    
    async jwt({ token, user, account }) {
      // Simplified JWT callback - remove heavy session tracking
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Simplified session callback
      if (token) {
        const user = (session.user ?? {}) as any;
        return {
          ...session,
          user: {
            ...user,
            id: token.id as string,
            email: token.email as string,
            name: token.name as string,
            image: token.image as string,
          },
        };
      }
      return session;
    }
  }
})

export { handler as GET, handler as POST }
