import React, { useEffect, useState, useCallback, useRef } from "react";
import { sendnsee } from "../handlers/ChatbotHandler.js";
import { useNavigate } from "react-router-dom";
import { renderMarkdown } from '../handlers/MarkdownHandler';
import { useAuth } from '../contexts/AuthContext';
import ChatSurvey from '../components/ChatSurvey';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { 
  FiMessageSquare, 
  FiSend, 
  FiPlus, 
  FiTrash2, 
  FiMenu, 
  FiX, 
  FiMessageCircle,
  FiThumbsUp
} from 'react-icons/fi';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // Store pending action after survey
  const [surveyTriggerReason, setSurveyTriggerReason] = useState(null); // Track why survey was triggered
  const [chatsSurveyShown, setChatsSurveyShown] = useState(new Set()); // Track chats that have already shown survey
  const [shouldBlinkFeedback, setShouldBlinkFeedback] = useState(false); // Control feedback button blinking
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to latest message
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();

  const initializeChat = useCallback(async () => {
    try {
      // Check both authentication and user data
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!isAuthenticated || !token || !storedUser) {
        console.log('Authentication check failed:', { 
          isAuthenticated, 
          hasToken: !!token, 
          hasUser: !!storedUser 
        });
        navigate('/login');
        return;
      }

      // Verify user data is valid
      let user;
      try {
        user = JSON.parse(storedUser);
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        navigate('/login');
        return;
      }
      
      if (!user || !user.User_ID) {
        console.error('Invalid user data:', user);
        navigate('/login');
        return;
      }

      console.log('Initializing chat for user:', user.User_ID);

      // Load all chats
      const chatsResponse = await fetch(`/api/chat/user/${user.User_ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!chatsResponse.ok) {
        const errorData = await chatsResponse.json();
        console.error('Failed to fetch chat history:', errorData);
        throw new Error(errorData.message || 'Failed to fetch chat history');
      }

      const chats = await chatsResponse.json();
      console.log('Loaded chats:', chats.length);
      
      const sortedChats = chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setChatHistory(sortedChats);

      if (sortedChats.length > 0) {
        // Set the latest chat as active
        const latestChat = sortedChats[0];
        console.log('Setting active chat:', latestChat.Chat_ID);
        setActiveChatId(latestChat.Chat_ID);
        await loadChatHistory(latestChat.Chat_ID);
      } else {
        // Create a new chat if none exist
        const initialMessage = localStorage.getItem('initialChatMessage');
        if (initialMessage) {
          await createNewChat(initialMessage);
          localStorage.removeItem('initialChatMessage');
        } else {
          await createNewChat("Hi ATLab!");
        }
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
      alert(error.message || 'An error occurred while initializing the chat. Please try again.');
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Initialize chat on component mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setIsUserLoaded(true);
    } else {
      setIsUserLoaded(false);
    }
  }, [isAuthenticated, currentUser]);

  // Separate effect for chat initialization
  useEffect(() => {
    if (isUserLoaded && !isInitialized) {
      initializeChat();
    }
  }, [isUserLoaded, isInitialized, initializeChat]);

  const createNewChat = async (message) => {
    try {
      // Verify authentication and user data
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!isAuthenticated || !token || !storedUser) {
        console.log('Authentication check failed in createNewChat:', { 
          isAuthenticated, 
          hasToken: !!token, 
          hasUser: !!storedUser 
        });
        navigate('/login');
        return null;
      }

      // Parse and validate user data
      let user;
      try {
        user = JSON.parse(storedUser);
      } catch (parseError) {
        console.error('Error parsing user data in createNewChat:', parseError);
        navigate('/login');
        return null;
      }
      
      if (!user || !user.User_ID) {
        console.error('Invalid user data in createNewChat:', user);
        navigate('/login');
        return null;
      }

      // Prepare user context with all available fields
      const userContext = {
        Nickname: user.Nickname || '',
        First_Name: user.First_Name || '',
        Last_Name: user.Last_Name || '',
        Title: user.Title || '',
        Gender: user.Gender || '',
        Email_Address: user.Email_Address || '',
        Tel: user.Tel || '',
                        User_Role: user.User_Role || 'Non_ATL_General'
      };

      console.log('Creating new chat with user context:', userContext);

      const chatResponse = await fetch('/api/chat/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          User_ID: user.User_ID,
          initialMessage: message,
          userContext: userContext
        })
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        console.error('Chat creation failed:', errorData);
        throw new Error(errorData.message || 'Failed to create chat');
      }

      const chatData = await chatResponse.json();
      console.log('New chat created:', chatData);

      // Update state with new chat
      setActiveChatId(chatData.Chat_ID);
      await loadChatHistory(chatData.Chat_ID);
      
      // Refresh chat list
      await loadAllChats();
      
      return chatData;
    } catch (error) {
      console.error('Error creating chat:', error);
      alert(error.message || 'Failed to start chat. Please try again.');
      return null;
    }
  };

  const loadAllChats = useCallback(async () => {
    if (!currentUser?.User_ID) {
      console.error('No User_ID available in currentUser:', currentUser);
      return [];
    }

    try {
      const response = await fetch(`/api/chat/user/${currentUser.User_ID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch chat history');
      }

      const chats = await response.json();
      const sortedChats = chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setChatHistory(sortedChats);
      return sortedChats;
    } catch (error) {
      console.error('Error loading chat history:', error);
      alert(error.message || 'Failed to load chat history. Please try again.');
      setChatHistory([]);
      return [];
    }
  }, [currentUser]);

  const loadChatHistory = async (Chat_ID) => {
    try {
      const response = await fetch(`/api/chat/${Chat_ID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const chatData = await response.json();
        const formattedMessages = chatData.Messages.map(msg => ({
          text: msg.Text,
          isBot: msg.Is_Bot
        }));
        setMessages(formattedMessages);
        setActiveChatId(Chat_ID);
        localStorage.setItem('activeChatId', Chat_ID);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    }
  };

  const handleSend = useCallback(async () => {
    console.log('handleSend called with:', { 
      input: input.trim(), 
      isLoading, 
      User_ID: currentUser?.User_ID, 
      Chat_ID: activeChatId 
    });
    
    if (!input.trim() || isLoading || !currentUser?.User_ID || !activeChatId) {
      console.log('Cannot send message:', { input, isLoading, User_ID: currentUser?.User_ID, Chat_ID: activeChatId }); // Debug log
      return;
    }
    
    console.log('Sending message...');
    setIsLoading(true);
    const userMessage = { text: input, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      console.log('Calling sendnsee with:', input, activeChatId);
      const response = await sendnsee(input, activeChatId);
      console.log('Received response:', response);
      setInput("");
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      // Refresh chat list after sending message
      loadAllChats();
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Full error details:', error.message, error.stack);
      setMessages(prev => [...prev, { 
        text: "Sorry, there was an error processing your message. Please try again.", 
        isBot: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentUser, activeChatId, loadAllChats]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteChat = async (Chat_ID) => {
    try {
      const response = await fetch(`/api/database/${Chat_ID}?collection=CHAT&ID=Chat_ID`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // If the deleted chat was active, clear it
        if (activeChatId === Chat_ID) {
          setActiveChatId(null);
          setMessages([]);
        }
        
        // Reload chat history and set the latest chat as active
        const updatedChats = await loadAllChats();
        if (updatedChats && updatedChats.length > 0) {
          const latestChat = updatedChats[0];
          setActiveChatId(latestChat.Chat_ID);
          await loadChatHistory(latestChat.Chat_ID);
        } else {
          // If no chats left, create a new one
          await createNewChat("Hi ATLab!");
        }
      } else {
        throw new Error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const handleSurveySubmit = async (surveyData) => {
    try {
      const response = await fetch(`/api/chat/${activeChatId}/survey`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(surveyData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      console.log('Survey submitted successfully');
      
      // Mark this chat as having shown a survey
      setChatsSurveyShown(prev => new Set(prev).add(activeChatId));
      
      // Execute pending action based on trigger reason
      if (pendingAction) {
        await pendingAction();
        setPendingAction(null);
      } else if (surveyTriggerReason === 'manual') {
        // For manual survey submission, create a new chat
        await createNewChat("Hi ATLab!");
      }
      // For browser_exit, we don't need to do anything special
      
      // Reset trigger reason
      setSurveyTriggerReason(null);
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      throw error;
    }
  };

  // Check if current chat has any messages that would warrant a survey
  const shouldShowSurveyForChat = useCallback((chatId) => {
    if (!chatId) return false;
    // Only show survey if there are messages in the current chat and survey hasn't been shown for this chat
    return messages.length > 0 && !chatsSurveyShown.has(chatId);
  }, [messages, chatsSurveyShown]);

  // Update feedback button blinking based on chat state
  useEffect(() => {
    const canGiveFeedback = shouldShowSurveyForChat(activeChatId);
    setShouldBlinkFeedback(canGiveFeedback);
  }, [activeChatId, messages, chatsSurveyShown, shouldShowSurveyForChat]);

  // Initialize chat scroll position to show upper part of latest response
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      const container = document.getElementById('chatContainer');
      if (!container) {
        console.log('Container not found for initialization scroll');
        return;
      }
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.isBot) {
        console.log('Attempting to scroll to beginning of last bot message');
        
        // Wait for DOM to be fully rendered
        setTimeout(() => {
          // Find all chat message elements
          const chatMessages = container.querySelectorAll('.chat-message');
          console.log('Found chat messages:', chatMessages.length);
          
          if (chatMessages.length > 0) {
            // Get the last message (should be the bot message)
            const lastMessageElement = chatMessages[chatMessages.length - 1];
            console.log('Last message element:', lastMessageElement);
            
            // Check if it's actually a bot message by looking for the FaUserGraduate icon or "ATLab" text
            const isActuallyBotMessage = lastMessageElement.querySelector('.fa-user-graduate') || 
                                       lastMessageElement.textContent.includes('ATLab');
            
            if (isActuallyBotMessage) {
              console.log('Confirmed bot message, scrolling to its position');
              // Scroll to show the beginning of this message
              const messageTop = lastMessageElement.offsetTop - 20; // Small offset from top
              console.log('Scrolling to position:', messageTop);
              
              container.scrollTo({ 
                top: messageTop, 
                behavior: 'smooth' 
              });
            } else {
              console.log('Last message is not a bot message, looking for previous bot message');
              // Find the last actual bot message
              const botMessages = Array.from(chatMessages).filter(msg => 
                msg.querySelector('.fa-user-graduate') || msg.textContent.includes('ATLab')
              );
              
              if (botMessages.length > 0) {
                const lastBotMessage = botMessages[botMessages.length - 1];
                const messageTop = lastBotMessage.offsetTop - 20;
                console.log('Found bot message, scrolling to position:', messageTop);
                
                container.scrollTo({ 
                  top: messageTop, 
                  behavior: 'smooth' 
                });
              }
            }
          }
        }, 500); // Increased delay to ensure DOM is ready
      }
    }
  }, [isInitialized, messages.length, messages]);

  // Handle browser exit detection
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (shouldShowSurveyForChat(activeChatId)) {
        // Show survey for browser exit
        event.preventDefault();
        setSurveyTriggerReason('browser_exit');
        setShowSurvey(true);
        return (event.returnValue = "You have an active chat. Would you like to provide feedback before leaving?");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeChatId, messages, shouldShowSurveyForChat]);

  // Helper function to trigger survey before chat switch
  const triggerSurveyBeforeAction = (action, reason = 'chat_switch') => {
    if (shouldShowSurveyForChat(activeChatId)) {
      setPendingAction(() => action);
      setSurveyTriggerReason(reason);
      setShowSurvey(true);
    } else {
      // Execute action immediately if no survey needed
      action();
    }
  };

  // Wrapper functions for chat actions that should trigger surveys
  const switchToChat = (chatId) => {
    triggerSurveyBeforeAction(() => {
      loadChatHistory(chatId);
      setShowHistory(false);
    });
  };

  const createNewChatWithSurvey = (message = "Hi ATLab!") => {
    triggerSurveyBeforeAction(() => {
      createNewChat(message);
      setShowHistory(false);
    });
  };

  if (!isInitialized || !isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" text="Loading chat..." />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bg-white dark:bg-gray-900">
      <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Chat History Drawer */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${showHistory ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
           onClick={() => setShowHistory(false)}>
      </div>
      
      <div className={`fixed left-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-800 border-r border-primary-200 dark:border-gray-700 transform transition-transform duration-300 z-40 flex flex-col shadow-xl ${showHistory ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-primary-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-primary-900 dark:text-gray-100 flex items-center">
            <FiMenu className="mr-2" />
            Chat History
          </h2>
            <Button
              onClick={() => setShowHistory(false)}
              variant="ghost"
              size="sm"
              icon={FiX}
              title="Close Chat History"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3">
          {chatHistory.length === 0 ? (
            <div className="text-center py-8">
              <FiMessageSquare className="w-12 h-12 text-primary-300 dark:text-gray-500 mx-auto mb-4" />
              <p className="font-literary text-primary-500 dark:text-gray-300">No chat history available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
              <div
                key={chat.Chat_ID}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                  activeChatId === chat.Chat_ID 
                      ? 'bg-primary-100 dark:bg-primary-900/30 border-l-4 border-l-primary-500' 
                      : 'hover:bg-primary-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  switchToChat(chat.Chat_ID);
                }}
              >
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-serif font-medium truncate text-primary-900 dark:text-gray-100 mb-1">
                        {chat.Messages[0]?.Text?.length > 30 ? chat.Messages[0]?.Text.substring(0, 30) + '...' : chat.Messages[0]?.Text || 'New Chat'}
                    </div>
                      <div className="text-xs font-sans text-primary-500 dark:text-gray-300">
                      {formatDate(chat.updatedAt)}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this chat?')) {
                        handleDeleteChat(chat.Chat_ID);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    icon={FiTrash2}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  />
                  </div>
                </div>
              ))}
              </div>
          )}
        </div>

        {/* Add New Chat Button */}
        <div className="p-3 border-t border-primary-200 dark:border-gray-700 flex-shrink-0">
          <Button
            onClick={() => {
              createNewChatWithSurvey("Hi ATLab!");
            }}
            variant="primary"
            className="w-full shadow-lg hover:shadow-xl transition-all duration-200"
            icon={FiPlus}
            size="md"
          >
            Add New Chat
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-primary-200 dark:border-gray-700 p-3 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                onClick={() => setShowHistory(!showHistory)}
                variant="ghost"
                size="sm"
                icon={FiMenu}
                className="mr-3 text-primary-600 hover:text-primary-800 dark:text-gray-300 dark:hover:text-white"
                title="Toggle Chat History"
              />
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <FiMessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-serif font-bold text-primary-900 dark:text-gray-100">AI Assistant</h1>
                  <p className="text-sm font-literary text-primary-600 dark:text-gray-300">Ready to help you explore ATL</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setSurveyTriggerReason('manual');
                setShowSurvey(true);
              }}
              variant="success"
              size="sm"
              icon={FiThumbsUp}
              className={`${
                shouldBlinkFeedback ? 'animate-pulse ring-2 ring-success-400 ring-opacity-75' : ''
              } shadow-sm hover:shadow-md transition-all duration-200`}
              title="Give Feedback"
            >
              Feedback
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div id="chatContainer" className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message flex ${
                    message.isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md transition-all duration-200 hover:shadow-lg ${
                      message.isBot 
                        ? "bg-white dark:bg-gray-700 border border-primary-200 dark:border-gray-600" 
                        : "bg-primary-500 dark:bg-primary-600 text-white"
                    }`}
                  >
                    {message.isBot && (
                      <div className="flex items-center mb-3">
                        <FiMessageCircle className="mr-2 text-primary-500 dark:text-primary-400" size={16} />
                        <span className="text-sm font-serif font-medium text-primary-700 dark:text-white">ATLab Assistant</span>
                      </div>
                    )}
                    <div className={`prose prose-sm max-w-none font-literary leading-relaxed ${
                      message.isBot 
                        ? "text-primary-900 dark:text-white prose-headings:text-primary-900 dark:prose-headings:text-white prose-strong:text-primary-900 dark:prose-strong:text-white prose-code:text-primary-700 dark:prose-code:text-white prose-pre:bg-primary-50 dark:prose-pre:bg-gray-700 prose-pre:text-primary-900 dark:prose-pre:text-white prose-p:text-primary-900 dark:prose-p:text-white prose-li:text-primary-900 dark:prose-li:text-white prose-a:text-primary-600 dark:prose-a:text-white prose-ul:text-primary-900 dark:prose-ul:text-white prose-ol:text-primary-900 dark:prose-ol:text-white dark:[&_*]:!text-white" 
                        : "text-white prose-headings:text-white prose-strong:text-white prose-code:text-gray-100 prose-pre:bg-white/10 prose-pre:text-white prose-p:text-white prose-li:text-white prose-a:text-white"
                    }`}>
                      {renderMarkdown(message.text, { 
                        isBot: message.isBot,
                        toggleDarkHeader: !message.isBot,
                        showFullContent: true
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 border border-primary-200 dark:border-gray-600 rounded-2xl p-4 shadow-md max-w-[85%]">
                    <div className="flex items-center mb-3">
                      <FiMessageCircle className="mr-2 text-primary-500 dark:text-primary-400" size={16} />
                      <span className="text-sm font-serif font-medium text-primary-700 dark:text-white">ATLab Assistant</span>
                    </div>
                    <div className="flex items-center font-literary text-primary-600 dark:text-white">
                      <LoadingSpinner size="sm" className="mr-3" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible element for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>
          </div>

                    {/* Input Area */}
          <div className="bg-white dark:bg-gray-800 border-t border-primary-200 dark:border-gray-700 p-3 flex-shrink-0 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <Input
                    type="text"
                    name="message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="rounded-xl shadow-sm border-primary-300 dark:border-gray-500 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800"
                    placeholder="Type a message..."
                    disabled={isLoading}
                    icon={FiMessageSquare}
                    size="md"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  variant="primary"
                  size="md"
                  icon={FiSend}
                  loading={isLoading}
                  title="Send Message"
                  className="rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Modal */}
      {showSurvey && activeChatId && (
        <ChatSurvey
          chatId={activeChatId}
          onSubmit={handleSurveySubmit}
          onClose={() => {
            setShowSurvey(false);
            setPendingAction(null);
            setSurveyTriggerReason(null);
          }}
        />
      )}
      </div>
    </div>
  );
}

export default Chatbot;





