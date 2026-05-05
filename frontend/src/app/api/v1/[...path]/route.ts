import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const url = `http://127.0.0.1:8000/api/v1/${path}${queryString ? '?' + queryString : ''}`;

  const body = request.method !== 'GET' && request.method !== 'HEAD' 
    ? await request.arrayBuffer() 
    : undefined;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    // Skip host and other headers that fetch will set automatically or that might cause issues
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  try {
    const backendResponse = await fetch(url, {
      method: request.method,
      headers: headers,
      body: body,
      signal: AbortSignal.timeout(300000), // 5 min timeout
    });

    const responseData = await backendResponse.text();
    let json;
    try {
      json = JSON.parse(responseData);
    } catch (e) {
      json = { detail: responseData };
    }

    return NextResponse.json(json, { status: backendResponse.status });
  } catch (error: any) {
    console.error(`Proxy error for ${url}:`, error);
    return NextResponse.json(
      { detail: `Proxy error: ${error.message}` },
      { status: 504 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
