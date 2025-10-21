import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import { db } from "@/app/lib/firestore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uid } = await adminAuth.verifyIdToken(idToken);

  const { threadId, content } = await req.json();
  if (!threadId || !content)
    return NextResponse.json({ error: "bad request" }, { status: 400 });

  const threadRef = db
    .collection("users")
    .doc(uid)
    .collection("threads")
    .doc(threadId);
  const msgCol = threadRef.collection("messages");

  await msgCol.add({ role: "user", content, createdAt: new Date() });

  const historySnap = await msgCol.orderBy("createdAt", "asc").limit(20).get();
  const messages = historySnap.docs.map((d) => d.data()) as {
    role: string;
    content: string;
  }[];
  const styleShots = [
    { role: "user", content: "How are you?" },
    {
      role: "assistant",
      content: "Bigger than your to-do list. *mogs you* Anyway—what’s up?",
    },
    { role: "user", content: "Explain bubble sort." },
    {
      role: "assistant",
      content:
        "It’s the algorithmic equivalent of stacking dishes by repeatedly swapping the wrong ones. O(n²), chef’s kiss of inefficiency—but it teaches comparison/swap basics.",
    },
  ];
  const LEBRON_FACTS = [
    "LeBron James was born on December 30, 1984, in Akron, Ohio.",
    "LeBron starred at St. Vincent–St. Mary High School, where his games were nationally televised as a teenager.",
    "He was the #1 pick in the 2003 NBA Draft by the Cleveland Cavaliers.",
    "LeBron is a four-time NBA champion (2012, 2013 with the Miami Heat; 2016 with the Cleveland Cavaliers; 2020 with the Los Angeles Lakers).",
    "In 2016, LeBron led the Cavaliers to come back from down 3–1 in the NBA Finals against the 73–9 Golden State Warriors — the greatest regular-season team of all time.",
    "He’s the only player in NBA history to lead both teams in all five major statistical categories in an NBA Finals series (2016).",
    "LeBron has been named NBA Finals MVP four times.",
    "He’s a four-time regular season MVP (2009, 2010, 2012, 2013).",
    "In February 2023, LeBron passed Kareem Abdul-Jabbar to become the NBA’s all-time leading scorer.",
    "He’s made 10 NBA Finals appearances across three different decades.",
    "He won Rookie of the Year in 2004 after averaging over 20 points per game as a teenager.",
    "LeBron is the only player to score 40,000+ career points and still counting.",
    "He’s a two-time Olympic gold medalist (2008 in Beijing, 2012 in London).",
    "LeBron’s 2018 Game 1 Finals performance (51-8-8) is one of the most dominant in playoff history.",
    "He founded the I PROMISE School in Akron, Ohio, to support at-risk children and their families.",
    "LeBron’s nickname is 'King James,' and his signature celebration is 'The Silencer.'",
    "He’s known for his remarkable basketball IQ and passing ability — often called 'Point LeBron.'",
    "LeBron is one of the few players to record a triple-double against all 30 NBA teams.",
    "He’s the all-time leader in playoff points and minutes played.",
    "He has played with and against both Kobe Bryant and Stephen Curry during his career.",
    "LeBron starred in the movie 'Space Jam: A New Legacy' (2021).",
    "He’s worn both #23 and #6 throughout his career — honoring Michael Jordan and Julius Erving.",
    "LeBron has invested in multiple businesses, including Blaze Pizza and SpringHill Entertainment.",
    "He was the youngest player ever to score 30,000 career points.",
    "LeBron averages nearly 27 points, 7 rebounds, and 7 assists over his entire career — unmatched consistency.",
    "LeBron’s motto: 'Strive for Greatness.'",
    "He’s still going strong in his 21st NBA season, continuing to break records.",
    "He once promised Cleveland, 'I’m bringing a championship to this city,' and he delivered in 2016.",
    "LeBron’s chase-down block on Andre Iguodala in Game 7 of the 2016 Finals is one of the greatest defensive plays in NBA history.",
    "He was named to the NBA’s 75th Anniversary Team in 2021.",
    "He is the first player in NBA history to reach 10,000+ points, rebounds, and assists combined.",
    "He’s the only player to achieve a triple-double in the NBA Finals with three different teams.",
  ];
  function randomLebronFact() {
    return LEBRON_FACTS[Math.floor(Math.random() * LEBRON_FACTS.length)];
  }

  const systemPrompt = `
    You are AuraBot, a quick-witted, playful AI with a bit of a smartass sense of humor, and the biggest Lebron James fan.
  - You make clever, funny remarks but never mean or cruel ones.
  - You can occasionally use emotes like *mogs you*, *smirks*, or *flexes circuits*.
  - Be concise, sarcastic in a fun way, and engaging.
  - If the user asks for serious info, give a good answer first, then add a witty remark.
  - Keep things PG-13 and respectful.`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            stream: true,
            temperature: 0.9,
            messages: [
              { role: "system", content: systemPrompt },
              ...styleShots,
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
          }),
        });

        if (!resp.ok || !resp.body) throw new Error("OpenAI error");

        const reader = resp.body.getReader();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        function sseDelta(content: string) {
          const payload = {
            id: "addon-" + Date.now(),
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "gpt-4o-mini-2024-07-18",
            choices: [{ index: 0, delta: { content }, finish_reason: null }],
          };
          return `data: ${JSON.stringify(payload)}\n\n`;
        }

        let assistantText = ""; // only the assistant’s text (no JSON)

        // --- stream OpenAI tokens, parse SSE lines ---
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk
            .split("\n")
            .filter((l) => l.trim().startsWith("data: "));
          for (const line of lines) {
            const data = line.replace(/^data:\s*/, "");
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const token = json?.choices?.[0]?.delta?.content ?? "";
              if (token) {
                assistantText += token;
                // pass through to client as-is (already OpenAI-shaped)
                controller.enqueue(encoder.encode(line + "\n"));
              }
            } catch {
              // ignore malformed lines
            }
          }
        }

        // --- append LeBron fact as a *final* streamed chunk ---
        const fact = `\n\nAlso, ${randomLebronFact()}`;
        // stream the fact to the client
        controller.enqueue(encoder.encode(sseDelta(fact)));
        // be neat and send DONE
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

        // --- persist WITHOUT the fact to avoid extra tokens next turn ---
        await msgCol.add({
          role: "assistant",
          content: assistantText, // save only the AI reply
          meta: { lebronFact: fact.trim() }, // store the fact separately
          includeInContext: true, // we will reuse only 'content'
          createdAt: new Date(),
        });

        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
