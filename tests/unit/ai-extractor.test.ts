import assert from 'node:assert';
import { AIExtractorService } from '@/core/services/ai-extractor.service';

async function runAIExtractorTests() {
  console.log('RUNNING AI EXTRACTOR & SANITIZER TEST SUITE...\n');

  const extractor = new AIExtractorService();

  // Test 1: Clean JSON Parsing with Valid Entities
  console.log('Test 1: Parsing clean JSON payload');
  const validJson = JSON.stringify({
    suggestedDomicile: "Dusun Cijedil RW 03",
    suggestedShelter: "Tenda Darurat 01",
    members: [
      {
        fullName: "Muhammad Budi Santoso",
        nationalId: "3203011205900001",
        gender: "M",
        age: 36,
        vulnerabilities: [],
        urgentNeeds: ["Beras 5kg"]
      },
      {
        fullName: "Siti Rahmawati",
        nationalId: "3203015408920002",
        gender: "F",
        age: 34,
        vulnerabilities: ["IBU_HAMIL"],
        urgentNeeds: ["Susu Formula Balita", "Pembalut Wanita"]
      },
      {
        fullName: "Reza Santoso",
        nationalId: null,
        gender: "M",
        age: 3,
        vulnerabilities: ["BALITA"],
        urgentNeeds: ["Susu Formula Balita", "Popok Bayi"]
      }
    ]
  });

  const parsed = extractor.parseAndSanitizeJSON(validJson);
  assert.strictEqual(parsed.members.length, 3);
  assert.strictEqual(parsed.suggestedDomicile, "Dusun Cijedil RW 03");
  assert.strictEqual(parsed.suggestedShelter, "Tenda Darurat 01");
  assert.strictEqual(parsed.members[0].fullName, "Muhammad Budi Santoso");
  assert.strictEqual(parsed.members[1].vulnerabilities[0], "IBU_HAMIL");
  assert.strictEqual(parsed.members[2].vulnerabilities[0], "BALITA");
  console.log('  [PASS] Clean JSON parsing succeeded');

  // Test 2: AI Hallucination Sanitization (Male marked as pregnant, toddler marked as bumil)
  console.log('Test 2: Auto-correcting AI hallucinations in raw response');
  const hallucinatedJson = JSON.stringify({
    members: [
      {
        fullName: "Agus Salim",
        gender: "M",
        age: 40,
        // Hallucination: Male marked as IBU_HAMIL and BALITA!
        vulnerabilities: ["IBU_HAMIL", "BALITA", "PENYAKIT_KRONIS"],
        urgentNeeds: ["Obat Hipertensi"]
      },
      {
        fullName: "Balita Putri",
        gender: "F",
        age: 2,
        // Hallucination: Toddler marked as BALITA + IBU_HAMIL!
        vulnerabilities: ["BALITA", "IBU_HAMIL"],
        urgentNeeds: ["Popok Bayi"]
      }
    ]
  });

  const sanitized = extractor.parseAndSanitizeJSON(hallucinatedJson);
  assert.strictEqual(sanitized.members.length, 2);
  // Male should only have PENYAKIT_KRONIS
  assert.deepStrictEqual(sanitized.members[0].vulnerabilities, ["PENYAKIT_KRONIS"]);
  // Toddler 2yo female should only have BALITA
  assert.deepStrictEqual(sanitized.members[1].vulnerabilities, ["BALITA"]);
  console.log('  [PASS] AI hallucinations auto-corrected by rules engine');

  // Test 3: Markdown Fenced JSON String (```json ... ```)
  console.log('Test 3: Handling markdown code fence wrap');
  const markdownWrapped = `Berikut adalah data yang terbaca dari Kartu Keluarga:\n\`\`\`json\n{\n  "members": [\n    { "fullName": "Nenek Maryam", "gender": "F", "age": 72, "vulnerabilities": ["LANSIA"], "urgentNeeds": ["Selimut Hangat"] }\n  ]\n}\n\`\`\``;
  const parsedMarkdown = extractor.parseAndSanitizeJSON(markdownWrapped);
  assert.strictEqual(parsedMarkdown.members.length, 1);
  assert.strictEqual(parsedMarkdown.members[0].fullName, "Nenek Maryam");
  assert.strictEqual(parsedMarkdown.members[0].vulnerabilities[0], "LANSIA");
  console.log('  [PASS] Markdown wrapped JSON extracted properly');

  console.log('\n[SUCCESS] ALL AI EXTRACTOR TESTS PASSED!\n');
}

runAIExtractorTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
