import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

async function loadUser(id: string, cookie: string) {
  const cachedUser = cookie ? JSON.parse(cookie) : false;

  if (cachedUser && cachedUser.id === id) {
    return cachedUser;
  }

  const res = await fetch('https://graphql.us.fauna.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FAUNA_API_KEY}`,
    },
    body: JSON.stringify({
      query: `
        query ($id: ID!) {
          findUserByID(id: $id) {
            email
            customer
          }
        }
      `,
      variables: {
        id,
      },
    }),
  });

  if (!res.ok) {
    throw new Error('oops');
  }

  const data = await res.json();

  return data.data.findUserByID;
}

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
  let response = NextResponse.next();

  try {
    if (PUBLIC_FILE.test(req.nextUrl.pathname)) {
      return response;
    }

    if (req.nextUrl.pathname === '/') {
      // if (Boolean(req.cookies['welcome'])) {
      //   response = NextResponse.rewrite('/welcome');
      // }

      const userId = req.cookies['userId'];

      switch (true) {
        case Boolean(userId):
          const user = await loadUser(userId, req.cookies['user']);

          if (user.customer === true) {
            response = NextResponse.rewrite('/welcome');
          }

          if (user) {
            response.cookie('user', JSON.stringify(user));
          }

          break;

        default:
          response = NextResponse.next();
      }
    }
  } catch (error) {
    console.log(error);
  }

  return response;
}
