import { useState, useRef } from 'react';

// require npm install openai
// módulos necesarios para conectarse a la api de openai
import { Configuration, OpenAIApi } from 'openai';

// sender: 0 | 1
// 0: user
// 1: bot
// array default, con un mensaje de bienvenida
const DUMMY_MESSAGES = [{ id: 'm1', sender: 1, text: 'Hi, how are you?' }];
// se accede a la api key de openai almacenada en el archivo .env del proyecto
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

const ChatMessage = ({ message }) => {
  // object destructuring
  // extrae únicamente los campos sender y text
  const { sender, text } = message;
  // pemite definir el estilo del mensaje depende de su emisor
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
  // ref a ser usado en el input par escribir mensaje
  const inputRef = useRef(null);
  // controla el estado del array de mensajes a mostrar, toma como punto de partida el array default
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  // configuración necesaria y especificada por OpenAI
  const configuration = new Configuration({
    // asignación de la api key
    apiKey, // sintaxis ES6+, equivale a apiKey: apiKey
  });
  const openai = new OpenAIApi(configuration);

  // función que es invocada al enviar un mensaje
  const sendMessageHandler = async e => {
    e.preventDefault();
    // para preservar el valor del mensaje enviado
    const myMessage = inputRef.current.value;
    // estructuración del objeto mensaje basado en el mensaje enviado para ser añadido al array de mensajes (messages)
    const newMineMessage = {
      id: 'm' + (messages.length + 1),
      sender: 0,
      text: myMessage,
    };
    // se añade nuestro nuevo mensaje al array
    setMessages(
      // la siguiente forma asegura que esta actualización trabaja sobre el estado actual del array de mensajes
      prevMessages => {
      return prevMessages.concat(newMineMessage); // se añade el nuevo mensaje al array, se usa concat ya que este método de array retorna el array con el valor añadido
    });
    // limpia el input del mensaje
    inputRef.current.value = '';

    // plantilla de openai para el envío de mensajes
    const messageText = `The following is a conversation with a therapist and a user. The therapist is Aegis, who uses compassionate listening to have helpful and meaningful conversations with users. Aegis is empathic and friendly. Aegis's objective is to make the user feel better by feeling heard. With each response, Aegis offers follow-up questions to encourage openness and tries to continue the conversation in a natural way. \n\Aegis-> Hello, I am your personal mental health assistant. What's on your mind today?\nUser->${myMessage}Aegis->`;

    // Inicialización de la respuesta a recibir con un valor vacío
    let responseText = '';
    try {
      // lo siguiente retorna un objeto javascript 
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
      // la data que queremos dentro objeto completion es la respuesta que la ia daría a nuestro mensaje
      // hay varias opciones, pero elegimos la primera (choices[0])
      // momentáneamos se eliminan sub cadenas de texto que no queremos
      responseText = completion.data.choices[0].text.replace(/(Aegis|User)->(.)+/g, '');
    } catch {
      // si hay un error el mensaje será uno por defecto
      responseText =
        'Sorry, I am not feeling well today. Please try again later.';
    }
    // con la respuesta ya obtenida se crea un nuevo objeto mensaje para ser añadido al array de mensajes que se muestra
    const newBotMessage = {
      id: 'm' + (messages.length + 2),
      sender: 1, // 1 indica que es de parte del bot
      text: responseText,
    };
    // se actualiza el estado de messages añadiendo el mensaje recibido por el bor
    setMessages(prevMessages => {
      return prevMessages.concat(newBotMessage);
    });
  };

  return (
    <>
      <main>
        {/* lista los mensajes del estado messages en componentes ChatMessage */}
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </main>
      {/* este form al ser emitido, llamará a la función especificada */}
      <form onSubmit={sendMessageHandler}>
        <input
        // el uso de ref permitirá acceder al valor de este input
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
