# TABLESERVE: AI Chatbot Dialogue Training & Voice Architecture Guide

## 1. Conversational AI Architecture Overview
The TABLESERVE platform integrates an intelligent conversational dining assistant built upon **Amazon Lex v2** principles, supporting **Two-Way Voice (Speech-to-Text & Text-to-Speech)** and **Multi-Turn Context State Tracking**.

```
                         +-----------------------------+
                         |      User / Diner           |
                         +--------------+--------------+
                                        | (Voice / Text)
                                        v
                         +-----------------------------+
                         |     React 18 Frontend       |
                         |  Web Speech API (STT & TTS) |
                         +--------------+--------------+
                                        | POST /api/chatbot/message
                                        v
                         +-----------------------------+
                         |    Amazon Lex v2 Engine     |
                         |  (sessionAttributes State)  |
                         +--------------+--------------+
                                        |
                 +----------------------+----------------------+
                 |                      |                      |
                 v                      v                      v
        +------------------+   +------------------+   +------------------+
        | Restaurant Search|   |  Menu & Pricing  |   | Table Locking    |
        | & Cuisines       |   |  Catalog         |   | & Amazon SNS     |
        +------------------+   +------------------+   +------------------+
```

---

## 2. Audio & Speech Capabilities (Two-Way Voice)

### 2.1. Speech-to-Text (Voice Input / Microphone 🎤)
* **Technology**: Web Speech Recognition API (`webkitSpeechRecognition` / `SpeechRecognition`).
* **Workflow**:
  1. The user clicks the microphone button (`🎤`) in the chat input bar.
  2. The microphone begins pulsing with a red listening indicator (`🔴 Listening... Speak now`).
  3. The user speaks naturally (e.g., *"Book a table at Bukhara for 4 people"* or *"Find Biryani in Hyderabad"*).
  4. The speech recognition engine captures audio, streams real-time speech analysis, transcribes it to text, and dispatches the payload to the NLU pipeline.

### 2.2. Text-to-Speech (Voice Output / Speaking Bot 🔊)
* **Technology**: Web Speech Synthesis API (`window.speechSynthesis`), architecturally aligned with **Amazon Polly Neural Voice**.
* **Workflow**:
  1. When the bot fulfills an intent, the response text is sanitized (stripping Markdown asterisks, emojis, and bullet formatting).
  2. The speech synthesis engine converts the clean response text into natural voice audio with a 1.0x conversational cadence.
  3. A toggle button in the header (`🔊 Audio ON` / `🔇 Muted`) allows the user to enable or mute voice replies.
  4. Users can also click the `🔊 Play Voice` button next to any bot message bubble to re-hear the audio.

---

## 3. Multi-Turn Dialogue Training & State Machine

The chatbot does not evaluate queries in isolation; it maintains conversation context across sequential dialogue turns using `sessionAttributes`:

### End-to-End Table Booking Dialogue Tree:
```text
[Turn 1: Intent Trigger]
User: "I want to book a table"
State: BOOKING_ELICIT_RESTAURANT
Bot: "Certainly! I'd be happy to guide your table reservation. Which restaurant would you like to dine at? (e.g., Bukhara, Saravanaa Bhavan, Paradise Biryani, Trishna, or Chokhi Dhani)"

[Turn 2: Slot 1 - Restaurant]
User: "Bukhara"
State: BOOKING_ELICIT_GUESTS
Extracted Slot: {Restaurant: "Bukhara - ITC Maurya"}
Bot: "Wonderful choice! Bukhara - ITC Maurya in Delhi is selected. How many guests will be dining with you? (e.g. 2, 4, 6)"

[Turn 3: Slot 2 - Party Size]
User: "4 guests"
State: BOOKING_ELICIT_TIME
Extracted Slot: {Guests: 4}
Bot: "Table for 4 guests at Bukhara - ITC Maurya. What date and time slot would you prefer? (For example: 'Tonight at 8:00 PM' or 'Tomorrow at 7:30 PM')"

[Turn 4: Slot 3 - Time & Fulfillment]
User: "Tonight at 8:00 PM"
State: COMPLETED (Reset to null)
Extracted Slot: {Time: "Tonight at 8:00 PM"}
Bot: "🎉 Congratulations! Your reservation is CONFIRMED:
      • Restaurant: Bukhara - ITC Maurya
      • Party Size: 4 Guests
      • Scheduled Time: Tonight at 8:00 PM
      • Status: CONFIRMED (Table Locked)
      An automated confirmation email has been dispatched via Amazon SNS!"
Action: Dispatches Amazon SNS notification event.
```

---

## 4. Amazon Lex 8 Trained Intents Matrix

| Intent Name | Sample Utterances (Trained Phrases) | Slots Extracted | Fulfillment Logic |
|:---|:---|:---|:---|
| **`GreetingIntent`** | "hi", "hello", "namaste", "good morning", "hey" | *None* | Welcomes diner and announces two-way voice features. |
| **`RestaurantSearchIntent`** | "find Biryani in Hyderabad", "North Indian in Delhi", "recommend seafood" | `{Cuisine}`, `{City}` | Multi-faceted fuzzy query across 18 regional Indian restaurants. |
| **`MenuIntent`** | "show menu for Bukhara", "what dishes do you have", "view food items" | `{RestaurantName}` | Fetches signature dishes and live INR (₹) prices. |
| **`ReservationIntent`** | "book a table", "reserve table for 4 at 8 PM", "table booking" | `{Restaurant}`, `{Guests}`, `{Time}` | Multi-turn slot elicitation + atomic double-booking lock + Amazon SNS alert. |
| **`ReservationStatusIntent`** | "check status of res-01", "my booking status", "check reservation" | `{ReservationId}` | Queries live reservation lifecycle status and assigned table number. |
| **`CancelReservationIntent`** | "cancel reservation res-01", "cancel my table" | `{ReservationId}` | Sets status to `CANCELLED` and immediately releases table slot back to pool. |
| **`HelpIntent`** | "help", "what can you do", "how to use chatbot" | *None* | Lists guided voice and text actions. |
| **`FallbackIntent`** | Unrecognized phrases (e.g. random text) | *None* | Returns: "I didn't understand you. Please try asking about restaurant reservations or menus!" |
| **`OutOfDomainGuardrail`** | "book a bus ticket", "flight booking", "weather" | *None* | Domain restriction filter: Rejects non-dining requests and guides user back to restaurant tables. |

---

## 5. Winning Viva Answers for Your Presentation

### Q1: "How did you implement the audio and voice feature in your chatbot?"
> **Answer**:  
> *"Ma'am, we implemented a complete two-way voice architecture. For voice input (Speech-to-Text), we integrated the Web Speech Recognition API so users can speak naturally into their microphone. For voice output (Text-to-Speech), we integrated Speech Synthesis emulating Amazon Polly Neural Voices, which automatically reads out bot fulfillment responses with natural pacing."*

### Q2: "What dialogue training did you give to the chatbot?"
> **Answer**:  
> *"Ma'am, our chatbot is trained on an 8-intent conversational dataset defined in `aws/lex/tableserve-lex-bot.json` with an NLU confidence threshold of 0.40. Crucially, we implemented a **multi-turn dialogue state machine** using `sessionAttributes`. For example, in a table reservation dialogue, the bot tracks conversational state across 4 distinct turns: eliciting the restaurant name, eliciting the guest count, eliciting the time slot, and finally locking the table and dispatching an Amazon SNS email notification without asking the user to repeat information."*

### Q3: "What happens if someone asks your bot for something outside restaurant dining (like a bus ticket or weather)?"
> **Answer**:  
> *"Ma'am, we trained an **Out-of-Domain Guardrail Filter**. If a user enters out-of-scope requests such as 'book a bus ticket', 'train tickets', or 'flight booking', the chatbot rejects the request with: 'I didn't understand you. I am TABLESERVE's restaurant dining assistant and can only help with restaurant table reservations, menus, and food queries.' It will not confuse a bus ticket with a dining reservation."*
