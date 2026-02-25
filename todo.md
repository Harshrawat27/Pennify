1. in first it's not showing current we have to load it again, but i'll check again.
2. yearly budget, monthly budget is not getting set? and need to remove some features fs.
3. whenever user open app for first time we show main screen for 1 sec.

-- security risk.

and because we have all the convex code in web is it safe? or anyone from outside can  
 access other people data? because it's a bridge?

⏺ Good security question. Let me break it into two parts:

1. Is the Vercel bridge a security risk?

No. pennifyweb is just an HTTPS proxy — it forwards auth requests to Convex and passes the  
 response back. No credentials are stored there, no data passes through it (only auth  
 tokens).

2. The REAL security concern — userId as argument

This is the actual issue to think about. Your Convex functions look like this:

// accounts.ts
export const list = query({
args: { userId: v.string() },
handler: async (ctx, { userId }) => {
return ctx.db.query('accounts')
.withIndex('by_user', q => q.eq('userId', userId))
.collect();
},
});

The problem: The function trusts whoever calls it to pass their own userId. It doesn't
verify "is the caller actually this user?". So technically, if someone called your Convex
endpoint with a different user's ID, they'd get that user's data.

How bad is this in practice?

- Convex user IDs are 32-char random strings (jd759krak38wey3s3hkpbgx8r581qbqf) —
  essentially impossible to guess/enumerate
- There's no public endpoint to list all users
- Real risk: very low, but not zero

The Proper Fix

Use ctx.auth instead of userId as an arg. With Better Auth + Convex, authenticated calls
carry a JWT. Convex can verify it server-side:

export const list = query({
args: {},
handler: async (ctx) => {
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error('Unauthenticated');
const userId = identity.subject; // verified server-side

      return ctx.db.query('accounts')
        .withIndex('by_user', q => q.eq('userId', userId))
        .collect();
    },

});

This way no user can ever access another user's data, even if they know the userId.

The challenge is wiring the Better Auth JWT into the Convex client on mobile — this requires
using ConvexBetterAuthProvider which previously caused the session flip bug. But that's a
solvable problem for when you're closer to production.

For now: the random-ID approach is fine for development. Before launch, switching to
ctx.auth is the right move.

- why we are not adding email in DB

- goal has a relation with currentbalance not with expense and income and even if there is a relation then upon deletion why are you adding that as income and not removing as expense? not doing good.
