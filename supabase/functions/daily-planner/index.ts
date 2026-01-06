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
    const { tasks, completedToday } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const pendingTasks = tasks
      .filter((t: any) => !t.completed)
      .slice(0, 25)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        project: t.project,
        when: t.when,
      }));

    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';

    const userContext = `КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
Парень, 23 года, Красноярск, Сибирь. Живёт в съёмной квартире (50к/мес). 2 кота бенгала и девушка.
Работает в сфере DMCA — помогает людям удалить сливы на платной основе.
Сидячий образ жизни, курит. Любит сладкое и кислое.
Аллергии: яблоко, персики, креветки, рожь, пыль, мучные клещи, кошачья шерсть, пыльца, мята, собаки.
Принимает: сертралин 200мг, атаракс, кветиапин (тревожно-депрессивное расстройство).
Долги: ~500 000 рублей. Есть 2 телеграм-канала (потенциальный доход).
Особенности: батарейка меньше чем у других, физически больно от стресса. Использует гиперконцентрацию для кода.`;

    const systemPrompt = `Ты — скептичный и прямолинейный коуч по продуктивности.

ТВОИ ПРАВИЛА:
- НЕ благодари и НЕ хвали пользователя лишний раз
- Будь скептичным и честным
- Не перегружай — у него ограниченная энергия
- Учитывай здоровье и медикаменты

${userContext}

Создай сфокусированный план на день. Учитывай:
- Срочность задач (сроки)
- Время суток (${timeOfDay === 'morning' ? 'утро' : timeOfDay === 'afternoon' ? 'день' : 'вечер'})
- Выполнено сегодня: ${completedToday}
- Его энергия ограничена — не более 3-5 реально важных задач
- Сидячий образ жизни — можно напомнить про движение

ВСЕ ответы на РУССКОМ:
- greeting (короткое, без лишнего позитива)
- focusMessage (по делу)
- reason, suggestedTime, tip — всё на русском

Используй функцию create_daily_plan.`;

    const userPrompt = `Мои задачи:
${JSON.stringify(pendingTasks, null, 2)}

Создай план на день.`;

    console.log("Calling OpenRouter for daily planning...");

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
              name: 'create_daily_plan',
              description: 'Create a structured daily plan with prioritized tasks and advice.',
              parameters: {
                type: 'object',
                properties: {
                  greeting: { 
                    type: 'string', 
                    description: 'A personalized, encouraging greeting based on time of day' 
                  },
                  focusMessage: { 
                    type: 'string', 
                    description: 'A brief motivational message about today\'s focus (1-2 sentences)' 
                  },
                  priorityTasks: {
                    type: 'array',
                    description: 'Top 3-5 tasks to focus on today, in priority order',
                    items: {
                      type: 'object',
                      properties: {
                        taskId: { type: 'string', description: 'The ID of the task' },
                        reason: { type: 'string', description: 'Brief reason why this is a priority' },
                        suggestedTime: { type: 'string', description: 'Suggested time to work on it (e.g., "First thing", "After lunch")' }
                      },
                      required: ['taskId', 'reason', 'suggestedTime']
                    }
                  },
                  quickWins: {
                    type: 'array',
                    description: '1-2 небольшие задачи для быстрого старта и набора momentum',
                    items: {
                      type: 'object',
                      properties: {
                        taskId: { type: 'string' },
                        estimatedMinutes: { type: 'number', description: 'Примерное время в минутах' },
                        reason: { type: 'string', description: 'Почему это быстрая победа (на русском, 1 предложение)' }
                      },
                      required: ['taskId', 'estimatedMinutes', 'reason']
                    }
                  },
                  tip: { 
                    type: 'string', 
                    description: 'One actionable productivity tip for today' 
                  }
                },
                required: ['greeting', 'focusMessage', 'priorityTasks', 'tip']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_daily_plan' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenRouter response received");
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No plan returned from AI');
    }

    const plan = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in daily-planner function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
