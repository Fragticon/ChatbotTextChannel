import { useState, useRef } from 'react';
import { Configuration, OpenAIApi } from 'openai';

// 0: user, 1: bot
const DUMMY_MESSAGES = [{ id: 'm1', sender: 1, text: 'Hi, how are you?' }];
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const ChatMessage = ({ message }) => {
  const { sender, text } = message;
  const messageClass = sender === 0 ? 'sent' : 'received';
  return (
    <>
      <div className={`message ${messageClass}`}>
        <p>{text}</p>
      </div>
    </>
  );
};

const ChatRoom = () => {
  const inputRef = useRef(null);
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  const configuration = new Configuration({
    apiKey,
  });
  const openai = new OpenAIApi(configuration);

  const sendMessageHandler = async e => {
    e.preventDefault();
    // to preserver and avoid mutating the value of the input field
    const myMessage = inputRef.current.value;
    const newMineMessage = {
      id: 'm' + (messages.length + 1),
      sender: 0,
      text: myMessage,
    };
    // add the new message to the list of messages
    setMessages(prevMessages => {
      return prevMessages.concat(newMineMessage);
    });
    // clear the input field
    inputRef.current.value = '';

    // openai message template
    const messageText = `The following is a conversation with a therapist and a user. The therapist is Aegis, who uses compassionate listening to have helpful and meaningful conversations with users. Aegis is empathic and friendly. Aegis's objective is to make the user feel better by feeling heard. With each response, Aegis offers follow-up questions to encourage openness and tries to continue the conversation in a natural way. \n\Aegis-> Hello, I am your personal mental health assistant. What's on your mind today?\nUser->${myMessage}Aegis->`;

    let responseText = '';
    try {
      const completion = await openai.createCompletion({
        model: 'davinci:ft-personal-2022-12-07-23-53-55',
        prompt: messageText, // you can format this however you want
        temperature: 0.89,
        max_tokens: 162,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: ['\n'],
      });
      responseText = completion.data.choices[0].text.replace(/(Aegis|User)->(.)+/g, '');
    } catch {
      responseText =
        'Sorry, I am not feeling well today. Please try again later.';
    }

    const newBotMessage = {
      id: 'm' + (messages.length + 2),
      sender: 1,
      text: responseText,
    };
    setMessages(prevMessages => {
      return prevMessages.concat(newBotMessage);
    });
  };

  return (
    <>
      <main>
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </main>
      <form onSubmit={sendMessageHandler}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your message here"
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
};

export default ChatRoom;
