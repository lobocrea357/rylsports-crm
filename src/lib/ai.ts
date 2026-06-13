import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Category, SaleStatus } from "./pocketbase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface AIAnalysis {
  category: Category;
  sale_status: SaleStatus;
  summary: string;
}

export async function analyzeConversation(
  messages: Array<{ from_me: boolean; content: string; timestamp: string }>
): Promise<AIAnalysis> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const transcript = messages
    .slice(-30)
    .map((m) => `[${m.from_me ? "Nosotros" : "Cliente"}]: ${m.content}`)
    .join("\n");

  const prompt = `Eres el asistente de análisis de ventas para RyL Sports Vzla, un almacén de ropa deportiva al mayor en Venezuela.

Analiza esta conversación de WhatsApp y responde SOLO con JSON válido, sin markdown ni explicaciones:

Conversación:
${transcript}

Devuelve exactamente este JSON:
{
  "category": "<una de: prospect|interested|negotiating|sold|cold|support>",
  "sale_status": "<una de: none|close|done>",
  "summary": "<resumen en español de máximo 2 oraciones sobre el estado del cliente y su interés>"
}

Reglas:
- prospect: primer contacto, no sabemos su interés
- interested: preguntó por productos, precios o disponibilidad
- negotiating: está activamente negociando, pidiendo descuentos o cantidades
- sold: ya compró o confirmó pedido
- cold: no respondió en mucho tiempo o perdió interés
- support: tiene un problema con un pedido ya realizado
- sale_status "close": la venta parece inminente (negociando precio final, pidiendo datos de pago)
- sale_status "done": hay confirmación de compra/pago
- sale_status "none": los demás casos`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(clean) as AIAnalysis;
  } catch {
    return { category: "prospect", sale_status: "none", summary: "No se pudo analizar la conversación." };
  }
}
