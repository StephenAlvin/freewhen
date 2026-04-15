export const onRequest: PagesFunction = async (ctx) => {
  try {
    return await ctx.next();
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
