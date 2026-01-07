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
    const { input, currentDate } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const systemPrompt = `Ты — парсер задач. Твоя задача — извлечь из текста на естественном языке:
1. Чистый заголовок задачи (без даты/времени)
2. Дату выполнения (если указана)
3. Время (если указано)
4. Тип задачи: today, anytime, someday

Текущая дата: ${currentDate}

Правила парсинга дат:
- "завтра" = следующий день от текущей даты
- "послезавтра" = +2 дня
- "в понедельник/вторник/etc" = ближайший такой день
- "через неделю" = +7 дней
- "в 15:00" или "в 3 часа" = время
- "вечером" = примерно 19:00
- "утром" = примерно 09:00
- Если дата не указана — не добавляй дату

Используй функцию parse_task.`;

    console.log("Parsing task:", input);

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
          { role: 'user', content: input }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'parse_task',
              description: 'Распарсить задачу из естественного языка',
              parameters: {
                type: 'object',
                properties: {
                  title: { 
                    type: 'string', 
                    description: 'Чистый заголовок задачи без даты/времени' 
                  },
                  dueDate: { 
                    type: 'string', 
                    description: 'Дата в формате YYYY-MM-DD или null если не указана' 
                  },
                  dueTime: { 
                    type: 'string', 
                    description: 'Время в формате HH:MM или null если не указано' 
                  },
                  when: { 
                    type: 'string', 
                    enum: ['today', 'anytime', 'someday'],
                    description: 'Тип задачи: today если на сегодня, anytime если дата указана, someday если "когда-нибудь"'
                  },
                  hasParsedDate: {
                    type: 'boolean',
                    description: 'true если в тексте была найдена дата/время'
                  }
                },
                required: ['title', 'when', 'hasParsedDate'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'parse_task' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Parse result received");
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.log("No tool call found, returning original input");
      return new Response(JSON.stringify({ 
        title: input, 
        when: 'inbox',
        hasParsedDate: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify({ 
        title: input, 
        when: 'inbox',
        hasParsedDate: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parse-task function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
