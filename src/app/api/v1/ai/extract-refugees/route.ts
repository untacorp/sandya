import { NextRequest, NextResponse } from "next/server";
import { AIExtractorService } from "@/core/services/ai-extractor.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType, rawText, config } = body;

    const extractor = new AIExtractorService();
    // Default server config fallback if client did not supply specific BYOK
    const effectiveConfig = {
      provider: config?.provider || (process.env.GEMINI_API_KEY ? 'GEMINI' : process.env.OPENAI_API_KEY ? 'OPENAI' : 'OFFLINE_ONLY'),
      apiKey: config?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: config?.baseUrl || process.env.NEXT_PUBLIC_AI_CUSTOM_BASE_URL,
      modelName: config?.modelName || process.env.NEXT_PUBLIC_GEMINI_MODEL,
    };

    if (effectiveConfig.provider === 'OFFLINE_ONLY') {
      return NextResponse.json(
        {
          ok: false,
          error: "AI_DISABLED",
          message: "AI Gateway belum memiliki API Key terkonfigurasi. Silakan atur di Pengaturan Organisasi atau gunakan input manual.",
        },
        { status: 400 }
      );
    }

    const result = await extractor.extractRefugees(
      { imageBase64, mimeType, rawText },
      effectiveConfig
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error.code,
          message: result.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      payload: result.value,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: msg,
      },
      { status: 500 }
    );
  }
}
