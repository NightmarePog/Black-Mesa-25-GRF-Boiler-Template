import './style.css';

function Message({ author, message }: { author: string; message: string }) {
    return (
      <>
        <div className='wrapper'>
            <p className='author'>{author}</p>
            <p className='message'>{message}</p>
        </div>
      </>
    );
  }
  
  export default Message;