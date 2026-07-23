import { ClaudeProvider } from '@/lib/ai/providers/claude-provider';
import type { AiProvider } from '@/lib/ai/types';

let cachedProvider: AiProvider | null = null;

/**
 * AI_PROVIDER環境変数に応じてAiProvider実装を返すファクトリ。
 * services/*からはこの関数経由でのみAIプロバイダを取得し、
 * Claude SDKやOpenAI SDK等を直接importしないこと。
 *
 * 将来OpenAI/Geminiに対応する場合は、providers/openai-provider.ts等を追加し、
 * このswitch文にケースを1つ足すだけでよい。
 */
export function getAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER ?? 'claude';

  switch (providerName) {
    case 'claude': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
      cachedProvider = new ClaudeProvider(apiKey);
      return cachedProvider;
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
  }
}
