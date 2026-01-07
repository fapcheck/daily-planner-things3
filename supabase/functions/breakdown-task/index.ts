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
    const { taskTitle, taskNotes } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const userContext = `КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
Парень, 23 года. Работает с DMCA. Сидячий образ жизни.
Ограниченная энергия, тревожно-депрессивное расстройство (сертралин, атаракс, кветиапин).
Использует гиперконцентрацию для кода. Долги ~500к.`;

    const systemPrompt = `Ты — скептичный помощник по продуктивности.

ТВОИ ПРАВИЛА:
- НЕ хвали лишний раз
- Будь прямолинейным
- Подзадачи должны быть реалистичными для человека с ограниченной энергией

${userContext}

Разбей задачу на 3-7 конкретных подзадач:
- Каждая подзадача конкретная и измеримая
- Логический порядок выполнения  
- Не более 20-30 минут на подзадачу (у него мало энергии)
- Глаголы действия в начале

ВСЕ подзадачи на РУССКОМ языке.
Используй функцию breakdown_task.`;

    const userPrompt = `Разбей задачу:

${taskTitle}
${taskNotes ? `Заметки: ${taskNotes}` : ''}`;

    console.log("Breaking down task:", taskTitle);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
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
              name: 'breakdown_task',
              description: 'Разбить сложную задачу на простые подзадачи',
              parameters: {
                type: 'object',
                properties: {
                  subtasks: {
                    type: 'array',
                    description: 'Список подзадач в порядке выполнения',
                    items: {
                      type: 'object',
                      properties: {
                        title: { 
                          type: 'string', 
                          description: 'Название подзадачи (на русском)' 
                        },
                        estimatedMinutes: { 
                          type: 'number', 
                          description: 'Примерное время выполнения в минутах' 
                        }
                      },
                      required: ['title']
                    }
                  },
                  tip: {
                    type: 'string',
                    description: 'Краткий совет по выполнению этой задачи (на русском)'
                  }
                },
                required: ['subtasks']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'breakdown_task' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Task breakdown received");
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No breakdown returned from AI');
    }

    const breakdown = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(breakdown), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in breakdown-task function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
