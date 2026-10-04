import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { isBusinessSuspended } from "@/lib/business-status";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Cached client promise so the adapter doesn't open a new connection on every reload in dev.
let clientPromise = global._mongoClientPromise;
if (!clientPromise) {
  clientPromise = global._mongoClientPromise = new MongoClient(uri).connect();
}

// Surfaces on the client as `code` so the login page can show a specific message.
class GoogleAccountError extends CredentialsSignin {
  code = "google_account";
}

class DeactivatedError extends CredentialsSignin {
  code = "deactivated";
}

class SuspendedError extends CredentialsSignin {
  code = "suspended";
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
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
        if (!user) return null;
        // Google-only accounts have no password to compare against.
        if (!user.password) throw new GoogleAccountError();

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        // Checked after the password so these messages are only shown to someone who knows it.
        // A suspended business turns its cashiers off too, and they should hear "suspended",
        // not "ask your owner". Owners may still sign in: they're sent to /suspended afterwards.
        if (user.role !== "superadmin" && (user.role === "cashier" || !user.isActive)) {
          if (await isBusinessSuspended(user.businessId, { fresh: true })) throw new SuspendedError();
        }
        if (!user.isActive) throw new DeactivatedError();

        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  events: {
    // First Google sign-in: the adapter creates a bare user. Make them an owner, and send
    // them to /setup to name their business (the proxy enforces this via setupComplete).
    async createUser({ user }) {
      await connectDB();
      await User.updateOne(
        { _id: user.id },
        { role: "owner", isActive: true, setupComplete: false }
      );
    },
  },
  callbacks: {
    // Google sign-in links to an existing account by email, so a deactivated user
    // (e.g. a cashier whose email is a Google account) must be stopped here too.
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      await connectDB();
      const dbUser = await User.findOne({ email: user.email }).select("isActive").lean();
      return dbUser?.isActive !== false;
    },
    async jwt({ token, user, trigger }) {
      // Load role/business info from the DB on sign-in (user is only set then) and whenever
      // the session is explicitly updated, e.g. after finishing setup.
      if (user || trigger === "update") {
        await connectDB();
        const id = user?.id ?? token.id;
        const dbUser = await User.findById(id).lean();
        token.id = id;
        token.role = dbUser?.role ?? "owner";
        token.businessId = dbUser?.businessId?.toString() ?? null;
        token.storeId = dbUser?.storeId?.toString() ?? null;
        // Users created before this flag existed have no value; a business means they're set up.
        token.setupComplete = dbUser?.setupComplete ?? Boolean(dbUser?.businessId);
        token.suspended =
          token.role !== "superadmin" && (await isBusinessSuspended(token.businessId, { fresh: true }));
      } else {
        if (token.role === "cashier" && token.id) {
          // Cashiers are deactivated by their owner, and a cookie issued earlier would otherwise
          // keep working until it expires. Returning null ends the session.
          await connectDB();
          const dbUser = await User.findById(token.id).select("isActive").lean();
          if (!dbUser || dbUser.isActive === false) return null;
        }
        // Re-checked on every session read so suspending a business takes effect straight away.
        // The proxy and the API routes act on this flag.
        if (token.role !== "superadmin") {
          token.suspended = await isBusinessSuspended(token.businessId);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.businessId = token.businessId;
      session.user.storeId = token.storeId;
      session.user.setupComplete = token.setupComplete;
      session.user.suspended = Boolean(token.suspended);
      return session;
    },
  },
});
