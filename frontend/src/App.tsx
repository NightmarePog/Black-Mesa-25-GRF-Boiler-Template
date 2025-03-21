import './App.css';
import MessageInput from './Components/MessageInput/MessageInput';
import Message from './Components/Message/Message';

function App() {
  return (
    <>
      <MessageInput/>
      <Message author='me' message='Hello World!'/>
      <Message author='someone else' message='Hello Wossrld!'/>
      <Message author='not me' message='Hello s!'/>
      <Message author='me' message='Hello a!'/>
    </>
  );
}

export default App;
