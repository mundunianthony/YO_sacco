import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchMessageThreads, fetchMessages, sendMessage, broadcastMessage } from '../../features/messages/messagesSlice';
import Card from '../../components/Shared/Card';
import Button from '../../components/Shared/Button';
import { formatDate } from '../../utils/formatters';

const MessagingPage = () => {
  const dispatch = useAppDispatch();
  const { threads, selectedThreadId, loading } = useAppSelector((state) => state.messages);
  const { user } = useAppSelector((state) => state.auth);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchMessageThreads(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (selectedThreadId && user?.id) {
      dispatch(fetchMessages({ userId: user.id, otherUserId: selectedThreadId }));
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        dispatch(fetchMessages({ userId: user.id, otherUserId: selectedThreadId }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [dispatch, selectedThreadId, user?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !selectedThreadId) return;

    await dispatch(sendMessage({
      from: user.id,
      to: selectedThreadId,
      text: newMessage.trim(),
    }));

    setNewMessage('');
  };

  const filteredThreads = threads.filter(thread =>
    thread.otherUserName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
        Messages
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Member List */}
        <Card className="md:col-span-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search members..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            {filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => dispatch({ type: 'messages/selectThread', payload: thread.id })}
                className={`w-full p-3 text-left rounded-lg transition-colors
                  ${selectedThreadId === thread.id
                    ? 'bg-primary-100 hover:bg-primary-200'
                    : 'hover:bg-gray-100'}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{thread.otherUserName}</span>
                  {thread.unreadCount > 0 && (
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {thread.lastMessage}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(thread.lastMessageTimestamp)}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="md:col-span-2">
          {selectedThreadId ? (
            <div className="h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {threads
                  .find(t => t.id === selectedThreadId)
                  ?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.from === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.from === user?.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-gray-500">
              Select a member to start messaging
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagingPage;