import Anthropic from '@anthropic-ai/sdk';
import type { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  AiProviderError,
  menuPlanOutputSchema,
  missingIngredientsOutputSchema,
  shoppingListOutputSchema,
  suggestRecipesOutputSchema,
  wasteReductionOutputSchema,
  type AiProvider,
  type MenuPlanInput,
  type MenuPlanOutput,
  type MissingIngredientsInput,
  type MissingIngredientsOutput,
  type ShoppingListInput,
  type ShoppingListOutput,
  type SuggestRecipesInput,
  type SuggestRecipesOutput,
  type WasteReductionInput,
  type WasteReductionOutput,
} from '@/lib/ai/types';
import { BASE_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { buildSuggestRecipesPrompt } from '@/lib/ai/prompts/suggest-recipes';
import { buildMissingIngredientsPrompt } from '@/lib/ai/prompts/missing-ingredients';
import { buildMenuPlanPrompt } from '@/lib/ai/prompts/menu-plan';
import { buildWasteReductionPrompt } from '@/lib/ai/prompts/waste-reduction';
import { buildShoppingListPrompt } from '@/lib/ai/prompts/shopping-list';

const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 4096;
const MAX_RETRIES = 1;

function toToolInputSchema(schema: ZodType) {
  const jsonSchema = zodToJsonSchema(schema, { target: 'jsonSchema7', $refStrategy: 'none' });
  // Claudeのtool input_schemaは素のJSON Schemaオブジェクトを期待するためメタ情報を除去
  delete (jsonSchema as Record<string, unknown>).$schema;
  return jsonSchema as Anthropic.Tool.InputSchema;
}

export class ClaudeProvider implements AiProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  private async callTool<T>(params: {
    toolName: string;
    toolDescription: string;
    outputSchema: ZodType<T>;
    userPrompt: string;
  }): Promise<T> {
    const { toolName, toolDescription, outputSchema, userPrompt } = params;

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: BASE_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
          tools: [
            {
              name: toolName,
              description: toolDescription,
              input_schema: toToolInputSchema(outputSchema),
            },
          ],
          tool_choice: { type: 'tool', name: toolName },
        });

        const toolUseBlock = response.content.find(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
        );

        if (!toolUseBlock) {
          throw new AiProviderError('Claudeがtool_useブロックを返しませんでした');
        }

        const parsed = outputSchema.safeParse(toolUseBlock.input);
        if (!parsed.success) {
          throw new AiProviderError('Claudeの応答がスキーマに一致しませんでした', parsed.error);
        }

        return parsed.data;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }
      }
    }

    if (lastError instanceof AiProviderError) throw lastError;
    throw new AiProviderError('Claude APIの呼び出しに失敗しました', lastError);
  }

  async suggestRecipes(input: SuggestRecipesInput): Promise<SuggestRecipesOutput> {
    return this.callTool({
      toolName: 'suggest_recipes',
      toolDescription: '在庫食材から作れる料理を5件、構造化データで返す',
      outputSchema: suggestRecipesOutputSchema,
      userPrompt: buildSuggestRecipesPrompt(input),
    });
  }

  async suggestWithMissingIngredient(
    input: MissingIngredientsInput,
  ): Promise<MissingIngredientsOutput> {
    return this.callTool({
      toolName: 'suggest_with_missing_ingredient',
      toolDescription: '指定した1食材を買い足した場合に新たに作れる料理を返す',
      outputSchema: missingIngredientsOutputSchema,
      userPrompt: buildMissingIngredientsPrompt(input),
    });
  }

  async suggestMenuPlan(input: MenuPlanInput): Promise<MenuPlanOutput> {
    return this.callTool({
      toolName: 'suggest_menu_plan',
      toolDescription: '指定期間の献立プランを返す',
      outputSchema: menuPlanOutputSchema,
      userPrompt: buildMenuPlanPrompt(input),
    });
  }

  async suggestWasteReduction(input: WasteReductionInput): Promise<WasteReductionOutput> {
    return this.callTool({
      toolName: 'suggest_waste_reduction',
      toolDescription: '賞味期限が近い食材を無駄にしないための料理提案を返す',
      outputSchema: wasteReductionOutputSchema,
      userPrompt: buildWasteReductionPrompt(input),
    });
  }

  async suggestShoppingList(input: ShoppingListInput): Promise<ShoppingListOutput> {
    return this.callTool({
      toolName: 'suggest_shopping_list',
      toolDescription: '不足している/買い足すべき食材のリストを返す',
      outputSchema: shoppingListOutputSchema,
      userPrompt: buildShoppingListPrompt(input),
    });
  }
}
