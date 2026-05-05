import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id') || 'default-user';
  
  // Forward the raw body to the backend
  const body = await request.arrayBuffer();
  const contentType = request.headers.get('content-type') || '';
  
  const backendResponse = await fetch(
    `http://127.0.0.1:8000/api/v1/resumes/upload?session_id=${sessionId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: body,
      signal: AbortSignal.timeout(300000), // 5 min
    }
  );

  const data = await backendResponse.json();
  
  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }
  
  return NextResponse.json(data);
}
