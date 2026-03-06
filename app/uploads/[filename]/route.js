import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
    try {
        // Next.js 15+ dynamic APIs
        const { filename } = await params;

        // Prevent path traversal
        const safeFilename = path.basename(filename);
        const filePath = path.join(process.cwd(), 'public', 'uploads', safeFilename);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        // Determine content type
        let contentType = 'image/jpeg';
        const ext = path.extname(safeFilename).toLowerCase();
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.svg') contentType = 'image/svg+xml';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File serving error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
