import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectDB();

                    let existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        existingUser = await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                        });
                    }

                    return true;
                } catch (error) {
                    console.error("Error during sign in:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            // On initial sign in, fetch user ID from DB and store in token
            if (account && user) {
                try {
                    await connectDB();
                    const dbUser = await User.findOne({ email: user.email });
                    if (dbUser) {
                        token.userId = dbUser._id.toString();
                    }
                } catch (error) {
                    console.error("Error fetching user in jwt callback:", error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            // Use the userId from the token (no DB call needed here)
            if (token.userId) {
                session.user.id = token.userId as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
    },
    session: {
        strategy: "jwt",
    },
});
