import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google,
        Credentials({
            name: "Super User",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                const superEmail = process.env.SUPER_USER_EMAIL;
                const superPass = process.env.SUPER_USER_PASSWORD;

                if (credentials.email === superEmail && credentials.password === superPass) {
                    return {
                        id: "superuser",
                        name: "Super User",
                        email: superEmail as string,
                        image: "" // Optional: Add a specific image for super user
                    };
                }
                return null;
            }
        })
    ],
    theme: {
        brandColor: "#6EE7F9", // Matches accent-start
        logo: "", // Could add a logo URL here
        buttonText: "Sign in with Google",
    },
    callbacks: {
        authorized: async ({ auth }) => {
            // Logged in users are authenticated, otherwise redirect to login page
            return !!auth
        },
    },
    pages: {
        signIn: '/login', // Custom sign-in page
    },
})
