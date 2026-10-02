import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Business from "@/models/Business";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Cached client promise so the adapter doesn't open a new connection on every reload in dev.
let clientPromise = global._mongoClientPromise;
if (!clientPromise) {
  clientPromise = global._mongoClientPromise = new MongoClient(uri).connect();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Google verifies emails, so let it link to an existing email/password account.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        await connectDB();
        const user = await User.findOne({ email });
        // Google-only users have no password; inactive users can't sign in.
        if (!user || !user.password || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  events: {
    // First Google sign-in: the adapter creates a bare user, so give them a business and the owner role.
    async createUser({ user }) {
      await connectDB();
      const business = await Business.create({
        name: `${user.name || "My"}'s Business`,
        ownerId: user.id,
        email: user.email,
      });
      await User.updateOne(
        { _id: user.id },
        { role: "owner", businessId: business._id, isActive: true }
      );
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // Load role/business info from the DB on sign-in (user is only set then).
      if (user) {
        await connectDB();
        const dbUser = await User.findById(user.id).lean();
        token.id = user.id;
        token.role = dbUser?.role ?? "owner";
        token.businessId = dbUser?.businessId?.toString() ?? null;
        token.storeId = dbUser?.storeId?.toString() ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.businessId = token.businessId;
      session.user.storeId = token.storeId;
      return session;
    },
  },
});
