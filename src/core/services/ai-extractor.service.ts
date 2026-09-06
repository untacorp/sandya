import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { HTTP_STATUS } from '@/core/shared/constants';
import { type VulnerabilityCategory } from '@/shared/types';
import { sanitizeVulnerabilities } from '../domain/refugees/vulnerability-rules';

export type AIProviderType =
  | 'SANDYA_GATEWAY'
  | 'GEMINI'
  | 'OPENAI'
  | 'CUSTOM_ENDPOINT'
  | 'OFFLINE_ONLY';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
}

export interface ExtractedRefugeeItem {
  fullName: string;
  nationalId?: string | null;
  gender: 'M' | 'F';
  age: number;
  domicileOrigin?: string;
  shelterLocation?: string;
  missingKinName?: string;
  vulnerabilities: VulnerabilityCategory[];
  urgentNeeds: string[];
  rawNotes?: string;
}

export interface AIExtractionResult {
  members: ExtractedRefugeeItem[];
  suggestedDomicile?: string;
  suggestedShelter?: string;
  rawResponseText?: string;
}

const AI_EXTRACTION_SYSTEM_PROMPT = `Anda adalah asisten AI ekstraksi dokumen tanggap darurat bencana untuk aplikasi Sandya (Offline-First Disaster Management).
Tugas Anda adalah membaca dokumen (foto Kartu Keluarga/KK, lembaran formulir pendaftaran, catatan kertas, atau pesan obrolan darurat) dan mengekstrak daftar data warga pengungsi menjadi format JSON terstruktur yang presisi.

ATURAN STRUKTUR OUTPUT:
Kembalikan HANYA JSON valid murni tanpa teks pembuka, tanpa markdown wrap jika memungkinkan, atau dalam blok json:
{
  "suggestedDomicile": "Nama Dusun/Desa asal (jika tertera di dokumen, misal: Dusun Cijedil RW 03)",
  "suggestedShelter": "Lokasi Tenda/Ruang penampungan (jika ada, misal: Tenda Darurat 01)",
  "members": [
    {
      "fullName": "Nama Lengkap Warga (Koreksi huruf kapital)",
      "nationalId": "16 digit angka NIK KTP atau null jika tidak ada/tidak jelas",
      "gender": "M" atau "F",
      "age": 0-127 (Hitung usia per tahun 2026 jika yang tertulis adalah tanggal/tahun lahir),
      "domicileOrigin": "Dusun asal spesifik jika berbeda",
      "shelterLocation": "Tenda spesifik jika berbeda",
      "missingKinName": "Nama kerabat yang dicari/terpisah jika ada catatan",
      "vulnerabilities": ["BALITA" | "IBU_HAMIL" | "LANSIA" | "DISABILITAS" | "LUKA_BERAT" | "PENYAKIT_KRONIS"],
      "urgentNeeds": ["Beras 5kg", "Susu Formula Balita", "Selimut Hangat", "Air Bersih Galon", "Popok Bayi", "Pembalut Wanita", "Obat & P3K", "Tenda & Terpal"]
    }
  ]
}

ATURAN KELOMPOK RENTAN:
- "BALITA": Khusus usia 0-5 tahun. JANGAN pilih BALITA dan IBU_HAMIL bersamaan!
- "IBU_HAMIL": Khusus perempuan (gender "F") usia reproduktif. Laki-laki DILARANG ditandai IBU_HAMIL!
- "LANSIA": Khusus usia >= 60 tahun. JANGAN pilih LANSIA dan BALITA bersamaan!
- "DISABILITAS", "LUKA_BERAT", "PENYAKIT_KRONIS": Dapat digabung dengan kategori apa pun.
`;

export class AIExtractorService {
  /**
   * Ekstraksi dari Gambar (Base64) atau Teks Dokumen
   */
  public async extractRefugees(
    input: { imageBase64?: string; mimeType?: string; rawText?: string },
    config: AIProviderConfig
  ): Promise<Result<AIExtractionResult, DomainError>> {
    if (config.provider === 'OFFLINE_ONLY') {
      return Err(
        new DomainError(
          'AI_DISABLED',
          'AI Ekstraksi dinonaktifkan (Mode Offline Saja). Gunakan input tabel spreadsheet manual.',
          HTTP_STATUS.BAD_REQUEST
        )
      );
    }

    try {
      let jsonString = '';

      if (config.provider === 'GEMINI') {
        jsonString = await this.callGemini(input, config);
      } else if (config.provider === 'OPENAI') {
        jsonString = await this.callOpenAI(input, config);
      } else if (config.provider === 'CUSTOM_ENDPOINT') {
        jsonString = await this.callCustomEndpoint(input, config);
      } else {
        // Fallback ke Sandya Gateway internal proxy
        jsonString = await this.callSandyaGateway(input, config);
      }

      const parsed = this.parseAndSanitizeJSON(jsonString);
      return Ok(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return Err(
        new DomainError(
          'AI_EXTRACTION_FAILED',
          `Gagal melakukan ekstraksi dokumen dengan AI: ${msg}`,
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      );
    }
  }

  private async callGemini(
    input: { imageBase64?: string; mimeType?: string; rawText?: string },
    config: AIProviderConfig
  ): Promise<string> {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API Key Google Gemini belum diatur. Masukkan API Key di Pengaturan Organisasi atau file .env');
    }

    const model = config.modelName || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts: unknown[] = [
      { text: AI_EXTRACTION_SYSTEM_PROMPT }
    ];

    if (input.rawText) {
      parts.push({ text: `DOKUMEN/TEKS INPUT UNTUK DIEKSTRAK:\n${input.rawText}` });
    }

    if (input.imageBase64) {
      const cleanBase64 = input.imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const mime = input.mimeType || 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType: mime,
          data: cleanBase64,
        }
      });
      parts.push({ text: "Silakan ekstrak seluruh daftar warga/keluarga yang terbaca dari foto dokumen di atas." });
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('Tidak ada output balasan dari model Gemini.');
    }
    return candidate;
  }

  private async callOpenAI(
    input: { imageBase64?: string; mimeType?: string; rawText?: string },
    config: AIProviderConfig
  ): Promise<string> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API Key OpenAI belum diatur. Masukkan API Key di Pengaturan Organisasi atau file .env');
    }

    const model = config.modelName || process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';
    const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    const userContent: unknown[] = [];

    if (input.rawText) {
      userContent.push({ type: 'text', text: `DOKUMEN/TEKS INPUT UNTUK DIEKSTRAK:\n${input.rawText}` });
    }

    if (input.imageBase64) {
      const imageUrl = input.imageBase64.startsWith('data:')
        ? input.imageBase64
        : `data:${input.mimeType || 'image/jpeg'};base64,${input.imageBase64}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
      userContent.push({ type: 'text', text: "Silakan ekstrak seluruh daftar warga dari gambar dokumen di atas." });
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: AI_EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '{}';
  }

  private async callCustomEndpoint(
    input: { imageBase64?: string; mimeType?: string; rawText?: string },
    config: AIProviderConfig
  ): Promise<string> {
    const baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_AI_CUSTOM_BASE_URL || 'http://localhost:11434/v1';
    const model = config.modelName || process.env.NEXT_PUBLIC_AI_CUSTOM_MODEL || 'llama3.2-vision';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const userContent: unknown[] = [];
    if (input.rawText) {
      userContent.push({ type: 'text', text: input.rawText });
    }
    if (input.imageBase64) {
      const imageUrl = input.imageBase64.startsWith('data:')
        ? input.imageBase64
        : `data:${input.mimeType || 'image/jpeg'};base64,${input.imageBase64}`;
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUrl }
      });
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: AI_EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Custom Endpoint error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '{}';
  }

  private async callSandyaGateway(
    input: { imageBase64?: string; mimeType?: string; rawText?: string },
    config: AIProviderConfig
  ): Promise<string> {
    const res = await fetch('/api/v1/ai/extract-refugees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
        rawText: input.rawText,
        config,
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Sandya AI Gateway error (${res.status})`);
    }

    const data = await res.json();
    return typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload);
  }

  public parseAndSanitizeJSON(rawText: string): AIExtractionResult {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedObj: {
      suggestedDomicile?: string;
      suggestedShelter?: string;
      members?: Array<{
        fullName?: string;
        nationalId?: string | null;
        gender?: string;
        age?: number | string;
        domicileOrigin?: string;
        shelterLocation?: string;
        missingKinName?: string;
        vulnerabilities?: string[];
        urgentNeeds?: string[];
      }>;
    } = {};

    try {
      parsedObj = JSON.parse(cleanJson);
    } catch {
      // Fallback regex jika JSON rusak sebagian
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedObj = JSON.parse(match[0]);
        } catch {
          parsedObj = { members: [] };
        }
      }
    }

    const rawMembers = Array.isArray(parsedObj.members) ? parsedObj.members : [];
    const validVulnerabilityCategories: VulnerabilityCategory[] = [
      'BALITA', 'IBU_HAMIL', 'LANSIA', 'DISABILITAS', 'LUKA_BERAT', 'PENYAKIT_KRONIS'
    ];

    const sanitizedMembers: ExtractedRefugeeItem[] = rawMembers.map((m) => {
      const rawGender = String(m.gender || 'M').toUpperCase().trim();
      const gender: 'M' | 'F' = rawGender === 'F' || rawGender === 'PEREMPUAN' || rawGender === 'P' ? 'F' : 'M';
      const ageNum = typeof m.age === 'number' ? Math.max(0, Math.min(127, m.age)) : parseInt(String(m.age || 30), 10) || 30;

      const rawVulns = Array.isArray(m.vulnerabilities)
        ? m.vulnerabilities
            .map((v) => String(v).toUpperCase().trim() as VulnerabilityCategory)
            .filter((v) => validVulnerabilityCategories.includes(v))
        : [];

      // Tegakkan sanitasi aturan kelompok rentan
      const cleanVulns = sanitizeVulnerabilities(gender, ageNum, rawVulns);

      const rawNeeds = Array.isArray(m.urgentNeeds)
        ? m.urgentNeeds.map((n) => String(n).trim()).filter(Boolean)
        : [];

      return {
        fullName: String(m.fullName || 'Warga Pengungsi').trim(),
        nationalId: m.nationalId && String(m.nationalId).replace(/\D/g, '').length === 16 ? String(m.nationalId).replace(/\D/g, '') : null,
        gender,
        age: ageNum,
        domicileOrigin: m.domicileOrigin ? String(m.domicileOrigin).trim() : parsedObj.suggestedDomicile,
        shelterLocation: m.shelterLocation ? String(m.shelterLocation).trim() : parsedObj.suggestedShelter,
        missingKinName: m.missingKinName ? String(m.missingKinName).trim() : undefined,
        vulnerabilities: cleanVulns,
        urgentNeeds: rawNeeds,
      };
    });

    return {
      members: sanitizedMembers,
      suggestedDomicile: parsedObj.suggestedDomicile,
      suggestedShelter: parsedObj.suggestedShelter,
      rawResponseText: rawText,
    };
  }
}
