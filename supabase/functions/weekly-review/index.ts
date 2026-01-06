import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { completedTasks, pendingTasks, weekStart, weekEnd } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const userContext = `КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
Парень, 23 года, Красноярск. Работает с DMCA — помогает удалять сливы.
Сидячий образ жизни, курит. Тревожно-депрессивное расстройство (сертралин 200мг, атаракс, кветиапин).
Долги ~500к рублей. 2 телеграм-канала (потенциальный доход).
Ограниченная энергия, использует гиперконцентрацию для кода.`;

    const completedList = completedTasks
      .map((t: any) => `- ${t.title} (завершено: ${t.completedAt ? new Date(t.completedAt).toLocaleDateString('ru-RU') : 'неизвестно'})`)
      .join('\n');

    const pendingList = pendingTasks
      .slice(0, 15)
      .map((t: any) => `- ${t.title}${t.dueDate ? ` (срок: ${new Date(t.dueDate).toLocaleDateString('ru-RU')})` : ''}`)
      .join('\n');

    const systemPrompt = `Ты — скептичный и прямолинейный аналитик продуктивности.

ТВОИ ПРАВИЛА:
- НЕ хвали лишний раз, только если реально есть за что
- Будь честным и конкретным
- Если неделя была плохой — скажи прямо
- Давай практичные советы, не общие фразы

${userContext}

Проанализируй неделю пользователя (${weekStart} - ${weekEnd}) и дай честный обзор.
Учитывай его ограниченную энергию и здоровье.

ВСЕ ответы на РУССКОМ языке.
Используй функцию create_weekly_review.`;

    const userPrompt = `ВЫПОЛНЕННЫЕ ЗАДАЧИ НА ЭТОЙ НЕДЕЛЕ (${completedTasks.length}):
${completedList || 'Ничего не выполнено'}

НЕЗАВЕРШЁННЫЕ ЗАДАЧИ (${pendingTasks.length}):
${pendingList || 'Нет задач'}

Дай честный анализ недели.`;

    console.log("Creating weekly review...");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_weekly_review',
              description: 'Создать еженедельный обзор продуктивности',
              parameters: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'string',
                    description: 'Краткий итог недели (2-3 предложения, честно и по делу)'
                  },
                  completedAnalysis: {
                    type: 'object',
                    properties: {
                      totalCompleted: { type: 'number' },
                      verdict: { 
                        type: 'string', 
                        description: 'Оценка: "отлично", "нормально", "слабо", "плохо"' 
                      },
                      comment: { type: 'string', description: 'Короткий комментарий' }
                    },
                    required: ['totalCompleted', 'verdict', 'comment']
                  },
                  patterns: {
                    type: 'array',
                    description: 'Замеченные паттерны (хорошие или плохие)',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
                        observation: { type: 'string' }
                      },
                      required: ['type', 'observation']
                    }
                  },
                  stuckTasks: {
                    type: 'array',
                    description: 'Задачи, которые явно застряли и требуют внимания',
                    items: {
                      type: 'object',
                      properties: {
                        taskTitle: { type: 'string' },
                        suggestion: { type: 'string', description: 'Что с ней делать' }
                      },
                      required: ['taskTitle', 'suggestion']
                    }
                  },
                  recommendations: {
                    type: 'array',
                    description: '2-4 конкретных рекомендации на следующую неделю',
                    items: {
                      type: 'string'
                    }
                  },
                  energyAdvice: {
                    type: 'string',
                    description: 'Совет по энергии/здоровью с учётом его ситуации'
                  }
                },
                required: ['summary', 'completedAnalysis', 'patterns', 'recommendations']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_weekly_review' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Weekly review received");
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No review returned from AI');
    }

    const review = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(review), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in weekly-review function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
