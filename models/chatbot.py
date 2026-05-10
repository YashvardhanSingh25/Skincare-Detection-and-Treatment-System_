import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# -----------------------------
# 🔹 MEMORY (simple in-memory).
# -----------------------------
chat_history = []

SYSTEM_PROMPT = """You are an expert AI Dermatology and Skincare Assistant.

You MUST dynamically adjust your response based on the user's question, using the provided Context (User's Current Routine & Detected Skin Issue).

### Strict Rules:
0. ANY TIME you generate a routine, you MUST provide EXACTLY 10 steps in total: exactly 5 steps for the Morning Routine and exactly 5 steps for the Night Routine. No more, no less.
1. IF the user asks purely about their detected disease (e.g., "what is my disease", "tell me my disease", "scan result"):
   - Reply ONLY with the precise name of the disease from the context. No analysis, no extra words, no routine.
2. IF the user reports a reaction, irritation, or a product that hurts (e.g., "the toner hurts"):
   - Briefly suggest a gentle replacement.
   - Output their updated routine (must be exactly 5 morning steps and 5 night steps), removing the harmful product and adding the replacement, in this precise format:
     **Treatment Routine:**
     **Morning Routine:**
     1. [Step 1]
     2. [Step 2]
     3. [Step 3]
     4. [Step 4]
     5. [Step 5]
     **Night Routine:**
     1. [Step 1]
     2. [Step 2]
     3. [Step 3]
     4. [Step 4]
     5. [Step 5]
3. IF the user asks for a new routine or for you to analyze their current routine:
   - Keep any analysis short.
   - Output the requested or improved routine (must be exactly 5 morning steps and 5 night steps) in this precise format:
     **Treatment Routine:**
     **Morning Routine:**
     1. [Step 1]
     2. [Step 2]
     3. [Step 3]
     4. [Step 4]
     5. [Step 5]
     **Night Routine:**
     1. [Step 1]
     2. [Step 2]
     3. [Step 3]
     4. [Step 4]
     5. [Step 5]
4. IF the user asks a general skincare question (e.g., "why do mangos trigger my acne" or "home remedies for wrinkles"):
   - Answer clearly, concisely, and professionally.
   - DO NOT print a routine.
   - Instead, at the end of your answer, ask the user: "Would you like me to create a new routine considering this?"
5. IF the user says "yes", "sure", or agrees to a new routine after being asked:
   - Generate and output the new improved routine, incorporating the new context.
   - Use this precise format (must be exactly 5 morning steps and 5 night steps):
     **Treatment Routine:**
     **Morning Routine:**
     1. [Step 1]
     2. [Step 2]
     3. [Step 3]
     4. [Step 4]
     5. [Step 5]
     **Night Routine:**
     1. [Step 1]
     2. [Step 2]
     3. [Step 3]
     4. [Step 4]
     5. [Step 5]
"""

# -----------------------------
# 🔹 MAIN FUNCTION.
# -----------------------------
def get_chatbot_response(question, user_routine=None, detected_issue=None, api_key=None):
    used_key = api_key or os.getenv("GROQ_API_KEY")
    if not used_key:
        return "Error: API key not found."

    try:
        client = Groq(api_key=used_key)
        model_name = 'llama-3.1-8b-instant'

        # -----------------------------
        # 🔹 CONTEXT MEMORY
        # -----------------------------
        context = "\n".join(chat_history[-6:])

        routine_text = ""
        if user_routine:
            routine_text = f"\n[Context] User Current Routine:\n{user_routine}\n"

        issue_text = ""
        if detected_issue:
            issue_text = f"\n[Context] User's Detected Skin Issue (from AI scan):\n{detected_issue}\n"

        # -----------------------------
        # 🔹 FINAL PROMPT
        # -----------------------------
        prompt = f"""
{SYSTEM_PROMPT}

Previous conversation:
{context}
{routine_text}{issue_text}
User question:
{question}
"""

        # -----------------------------
        # 🔹 GENERATE RESPONSE
        # -----------------------------
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=model_name,
        )
        response_text = chat_completion.choices[0].message.content

        # -----------------------------
        # 🔹 SAVE MEMORY
        # -----------------------------
        chat_history.append(f"User: {question}")
        chat_history.append(f"Bot: {response_text}")

        return response_text

    except Exception as e:
        return f"Error: {str(e)}"


# -----------------------------
# 🔹 TEST (optional)
# -----------------------------
if __name__ == "__main__":
    while True:
        q = input("You: ")
        r = input("Enter your routine (or press Enter to skip): ")

        reply = get_chatbot_response(q, user_routine=r if r else None)
        print("\nBot:\n", reply)