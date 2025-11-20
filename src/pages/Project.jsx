
import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from '../config/axios';
import { initializeSocket, recieveMessage, sendMessage } from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes('lang-') && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute('data-highlighted');
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

const Project = () => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [project, setProject] = useState(location.state.project);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const messageBox = useRef();
  const [messages, setMessages] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const fileInputRef = useRef(null);
  //const processedMessageIds = useRef(new Set()); // Track processed messages
  const [isUploading, setIsUploading] = useState(false);

  const handleUserClick = (id) => {
    setSelectedUserId(prevSelectedUserId => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setIsUploading(true);

    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected");
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", "abc");
    formData.append("email", user.email);
    formData.append("tags", "file");
    formData.append("imageFile", file);

    try {
      const response = await axios.post("/cloud/fileupload", formData);
      console.log("File uploaded successfully:", response.data);
      setMessage("");

      // Create a message with image data for rendering
      const cloudMessage = {
        type: 'image',
        text: response.data.message,
        imageUrl: response.data.imageUrl
      };
      
      // Convert to string for storage/transmission
      const cloudMessageString = JSON.stringify(cloudMessage);
      
      // Generate a unique messageId for tracking
      const messageId = Date.now().toString();
    //  processedMessageIds.current.add(messageId);
      
      sendMessage('project-message', {
        message: cloudMessageString,
        sender: user,
        messageId: messageId
      });
      
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: user, message: cloudMessageString, messageId: messageId }
      ]);
  
      sendMessageStore(user, cloudMessageString, messageId);

      setIsUploading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
    }
  };

  function addCollaborators() {
    axios.put("/projects/add-user", {
      projectId: location.state.project._id,
      users: Array.from(selectedUserId)
    }).then(res => {
      console.log(res.data);
      setIsModalOpen(false);
      // Refresh project data to show new collaborators
      fetchProjectData();
    }).catch(err => {
      console.log(err);
    });
  }

  function inputChangeHandler(e) {
    const newValue = e.target.value;
    setMessage(newValue);
    if (newValue.includes("@upload")) {
      console.log("Triggering file upload...");
      fileInputRef.current?.click();
    }
  }

  function send() {
    console.log(user);

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Generate a unique messageId for tracking
    const messageId = Date.now().toString();
   // processedMessageIds.current.add(messageId);

    sendMessage('project-message', {
      message: trimmedMessage,
      sender: user,
      messageId: messageId
    });

    setMessages(prevMessages => [
      ...prevMessages,
      { sender: user, message: trimmedMessage, messageId: messageId }
    ]);

    sendMessageStore(user, trimmedMessage, messageId);
    setMessage("");
    
    // Scroll to bottom after sending
    setTimeout(scrollToBottom, 100);
  }

  // Function to render message content based on its type
  function renderMessageContent(messageContent) {
    try {
      // Try to parse the message as JSON
      let messageObject;
      try {
        messageObject = JSON.parse(messageContent);
      } catch (error) {
        // If it's not valid JSON, treat as plain text
        return <p className="break-words text-gray-800">{messageContent}</p>;
      }

      // If it's an image message
      if (messageObject && messageObject.type === 'image') {
        return (
          <div className="image-message">
            <p className="mb-2 text-sm text-gray-600">{messageObject.text}</p>
            <img 
              src={messageObject.imageUrl} 
              alt="Uploaded" 
              className="rounded-md max-w-full max-h-64 object-contain border border-gray-200"
            />
          </div>
        );
      }

      // If it has text property (for AI messages)
      if (messageObject && messageObject.text) {
        return (
          <div className='overflow-auto bg-slate-800 text-white rounded-md p-4 shadow-md'>
            <Markdown
              children={messageObject.text}
              options={{
                overrides: {
                  code: SyntaxHighlightedCode,
                },
              }}
            />
          </div>
        );
      }

      // Fallback to displaying the original message
      return <p className="break-words text-gray-800">{messageContent}</p>;
    } catch (error) {
      console.error("Error rendering message:", error);
      return <p className="break-words text-gray-800">{messageContent}</p>;
    }
  }

  function WriteAiMessage(message) {
    console.log("In the write Ai messages", message);
    let messageObject;

    try {
      messageObject = JSON.parse(message);
    } catch (error) {
      console.warn("Received non-JSON message, wrapping it manually:", message);
      messageObject = { text: message };
    }

    console.log("Type of message:", typeof message);

    return (
      <div className='overflow-auto bg-slate-800 text-white rounded-md p-4 shadow-md'>
        <Markdown
          children={messageObject.text || message}
          options={{
            overrides: {
              code: SyntaxHighlightedCode,
            },
          }}
        />
      </div>
    );
  }

  const sendMessageStore = async (sender, newMessage, messageId) => {
    const projectId = location.state.project._id;

    try {
      await axios.post('/projects/messages', {
        projectId,
        sender: sender._id,
        message: newMessage,
        messageId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("Message stored successfully");
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const fetchProjectData = () => {
    axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
      console.log(res.data.project);
      setProject(res.data.project);
      setFileTree(res.data.project.fileTree || {});
    }).catch(err => {
      console.error("Error fetching project data:", err);
    });
  };

  useEffect(() => {
    initializeSocket(project._id);
  
    recieveMessage('project-message', data => {
      console.log("Received message:", data);
      
      try {
        // Try to parse the message as JSON
        let parsedMessage;
        try {
          parsedMessage = JSON.parse(data.message);
        } catch (error) {
          // If not valid JSON, use the message as is
          console.log("Message is not valid JSON, using as plain text");
          parsedMessage = null;
        }
        
        // For AI messages (from the AI user ID)
        if (data.sender._id === "607f1f77bcf86cd799439012") {
          // If we have a fileTree update
          if (parsedMessage && parsedMessage.fileTree) {
            setFileTree(prevFileTree => ({
              ...prevFileTree,
              ...parsedMessage.fileTree
            }));
          }
          
          // Add the message to state
          setMessages(prev => [...prev, { 
            ...data, 
            message: parsedMessage ? parsedMessage.text : data.message
          }]);
          
          // Store AI message in database
          if (parsedMessage) {
            sendMessageStore(data.sender, parsedMessage.text, data.sender.uid);
          }
        } else {
          // For regular user messages
          setMessages(prev => [...prev, { ...data }]);
        }
        
        // Scroll to bottom after receiving message
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
    
    fetchProjectData();
  
    axios.get('/users/all').then(res => {
      setUsers(res.data.allUsers);
    }).catch(err => {
      console.log(err);
    });
  
    const fetchMessages = async () => {
      console.log("Request for the messages");
      const projectId = location.state.project._id;
      try {
        const response = await axios.get(`/projects/messages/${projectId}`);
        console.log("Fetched messages:", response.data);
        setMessages(response.data);
        setTimeout(scrollToBottom, 300);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    
    fetchMessages();
    
    // Cleanup function
    return () => {
      console.log("Component unmounting, cleanup socket connections if needed");
      // Add any socket cleanup code here if needed
    };
  }, []);
   
  async function saveFileTree(ft) {
    console.log("function call saveFile");
    try {
      const response = await axios.put('/projects/update-file-tree', {
        projectId: project._id,
        fileTree: ft
      });
      console.log(response.data);
    } catch (err) {
      console.error("Error saving file tree:", err);
    }
  }

  function scrollToBottom() {
    if (messageBox.current) {
      messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }
  
  // Helper function to safely get initials from email
  const getInitials = (email) => {
    return email && typeof email === 'string' ? email.charAt(0).toUpperCase() : '?';
  };
  
  // Rest of your component code...

  return (
    <div className="h-screen w-screen flex bg-gray-50 overflow-hidden">
      {/* Left Panel - Chat */}
      <section className="left relative flex flex-col h-screen w-1/3 bg-white border-r border-gray-200 shadow-sm">
        <header className='flex justify-between items-center p-3
        px-4 w-full bg-white border-b border-gray-200 absolute z-10 top-0'>
          <div className="flex items-center">
            <h1 className="font-semibold text-gray-800">{project.name}</h1>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
              onClick={() => setIsModalOpen(true)}
            >
              <i className="ri-user-add-line"></i>
              <span>Add Collaborator</span>
            </button>
            <button 
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
              className='p-2 rounded-md hover:bg-gray-100 transition-colors'
              aria-label="Show collaborators"
            >
              <i className="ri-team-line text-gray-600"></i>
            </button>
          </div>
        </header>

        <div className="conversation-area pt-16 pb-16 flex-grow h-full relative">
          <div
            ref={messageBox}
            className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto 
            max-h-full scrollbar-hide pb-4"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="mb-3 p-3 bg-gray-100 rounded-full">
                  <i className="ri-chat-3-line text-2xl"></i>
                </div>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`${msg.sender._id === "607f1f77bcf86cd799439012" ? 'max-w-4/5' : 'max-w-3/4'} 
                  ${msg.sender._id == user._id.toString() ? 'ml-auto' : ''}  
                  message flex flex-col p-3
                  ${msg.sender._id == user._id.toString() 
                    ? 'bg-blue-50 border border-blue-100 rounded-lg rounded-br-none' 
                    : msg.sender._id === "607f1f77bcf86cd799439012" 
                      ? 'bg-gray-50 border border-gray-100 rounded-lg' 
                      : 'bg-gray-50 border border-gray-100 rounded-lg rounded-bl-none'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white font-medium">
                      {msg.sender && msg.sender.email ? getInitials(msg.sender.email) : '?'}
                    </div>
                    <small className='text-xs text-gray-500'>{msg.sender?.email || 'Unknown'}</small>
                  </div>
                  <div className='text-sm'>
                    {msg.sender._id === "607f1f77bcf86cd799439012"
                      ? WriteAiMessage(msg.message)
                      : renderMessageContent(msg.message)
                    }
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="input-area w-full absolute bottom-0 bg-white border-t border-gray-200 p-3">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                value={message}
                onChange={inputChangeHandler}
                onKeyDown={handleKeyDown}
                className='p-2 px-4 border-none outline-none flex-grow text-gray-700 placeholder-gray-400'
                type="text"
                placeholder='Type your message...'
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleUpload}
              />
              <div className="flex items-center px-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='p-2 text-gray-500 hover:text-gray-700 transition-colors'
                  title="Upload file"
                >
                  <i className="ri-attachment-2"></i>
                </button>
                <button
                  onClick={send}
                  disabled={message.trim() === '' || isUploading}
                  className={`p-2 px-4 rounded-md ${message.trim() === '' || isUploading ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'} transition-colors`}
                >
                  {isUploading ? (
                    <i className="ri-loader-4-line animate-spin"></i>
                  ) : (
                    <i className="ri-send-plane-fill"></i>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Collaborators Side Panel */}
        <div 
          className={`sidePanel w-full h-full flex flex-col gap-2 bg-white absolute z-20 transition-all duration-300 ease-in-out ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 shadow-lg`}
        >
          <header className='flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200'>
            <h1 className='font-semibold text-lg text-gray-800'>Collaborators</h1>
            <button 
              onClick={() => setIsSidePanelOpen(false)} 
              className='p-2 rounded-md hover:bg-gray-200 transition-colors'
            >
              <i className="ri-close-line"></i>
            </button>
          </header>
          <div className="users flex flex-col overflow-auto">
            {project.users && project.users.length > 0 ? (
              project.users.map((u, index) => {
                // Safely check if user has an email property
                const userEmail = u && u.email ? u.email : 'Unknown';
                
                return (
                  <div 
                    key={u._id || u.id || index}
                    className="user p-3 flex gap-3 items-center border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium'>
                      {getInitials(userEmail)}
                    </div>
                    <div>
                      <h1 className='font-medium text-gray-800'>{userEmail}</h1>
                      <span className="text-xs text-gray-500">
                        {u._id === user._id ? 'You' : 'Collaborator'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                <p>No collaborators yet. Add members to work together!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right Panel - Code Editor */}
      <section className="right flex-grow h-full flex">
        {/* File Explorer */}
        <div className="explorer h-full w-64 bg-gray-800 text-white overflow-y-auto">
          <div className="file-explorer-header px-4 py-3 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">FILES</h2>
              {/* <button className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <i className="ri-add-line"></i>
              </button> */}
            </div>
          </div>
          <div className="file-tree w-full">
            {Object.keys(fileTree).length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                <p>No files yet.</p>
                <p>Create a file to get started.</p>
              </div>
            ) : (
              Object.keys(fileTree).map((file, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentFile(file);
                    setOpenFiles([...new Set([...openFiles, file])]);
                  }}
                  className={`tree-element cursor-pointer p-2 px-4 flex items-center gap-2 w-full hover:bg-gray-700 transition-colors ${currentFile === file ? 'bg-gray-700' : ''}`}
                >
                  <i className={`ri-file-code-line text-blue-400`}></i>
                  <p className="text-sm truncate">{file}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="code-editor flex flex-col flex-grow h-full">
          {/* File Tabs */}
          <div className="editor-tabs flex items-center w-full border-b border-gray-300 bg-gray-100 overflow-x-auto">
            {openFiles.length === 0 ? (
              <div className="p-3 text-gray-500 text-sm">No files open</div>
            ) : (
              <div className="files flex">
                {openFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFile(file)}
                    className={`tab flex items-center min-w-max p-2 px-4 border-r border-gray-300
                      ${currentFile === file ? 'bg-white text-blue-600 font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <i className={`ri-file-code-line mr-2 ${currentFile === file ? 'text-blue-600' : 'text-gray-500'}`}></i>
                    <span className="truncate max-w-xs">{file}</span>
                    {/* Close Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFiles(openFiles.filter((f) => f !== file));
                        if (currentFile === file) {
                          setCurrentFile(openFiles.length > 1 ? openFiles.filter(f => f !== file)[0] : null);
                        }
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-300 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code Content */}
          <div className="editor-content flex-grow h-full overflow-auto bg-white">
            {currentFile && fileTree[currentFile] ? (
              <div className="code-editor-area h-full relative">
                <pre className="hljs h-full p-4 font-mono text-sm leading-relaxed">
                  <code
                    className="hljs h-full outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const updatedContent = e.target.innerText;
                      const ft = {
                        ...fileTree,
                        [currentFile]: {
                          file: {
                            contents: updatedContent
                          }
                        }
                      };
                      setFileTree(ft);
                      saveFileTree(ft);
                    }}
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight(
                        "javascript",
                        fileTree[currentFile]?.file?.contents || ""
                      ).value,
                    }}
                    style={{
                      whiteSpace: "pre-wrap",
                      paddingBottom: "25rem",
                      counterSet: "line-numbering",
                    }}
                  />
                </pre>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    <i className="ri-code-line"></i>
                  </div>
                  <h3 className="text-xl font-medium mb-2">No file selected</h3>
                  <p>Open a file from the file explorer to start coding</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add Collaborator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
            <header className='flex justify-between items-center p-4 border-b border-gray-200'>
              <h2 className='text-xl font-semibold text-gray-800'>Add Collaborators</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className='p-2 rounded-full hover:bg-gray-100 transition-colors'
              >
                <i className="ri-close-line text-gray-500"></i>
              </button>
            </header>
            <div className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-search-line text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search users..."
                  />
                </div>
              </div>
              
              <div className="users-list flex flex-col gap-1 max-h-96 overflow-auto mb-6">
                {users.length > 0 ? (
                  users.map(user => (
                    <div 
                      key={user._id} 
                      className={`user cursor-pointer hover:bg-gray-50 transition-colors ${Array.from(selectedUserId).indexOf(user._id) !== -1 ? 'bg-blue-50 border-blue-200' : 'border-transparent'} 
                        p-3 flex items-center justify-between rounded-md border`} 
                      onClick={() => handleUserClick(user._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className='w-10 h-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-700'>
                          {user.email ? getInitials(user.email) : '?'}
                        </div>
                        <div>
                          <h1 className='font-medium text-gray-800'>{user.email || 'Unknown'}</h1>
                          <p className="text-xs text-gray-500">
                            {project.users?.some(u => u._id === user._id) ? 'Already a collaborator' : ''}
                          </p>
                        </div>
                      </div>
                      {Array.from(selectedUserId).indexOf(user._id) !== -1 && (
                        <span className="flex-shrink-0 text-blue-500">
                          <i className="ri-check-line text-lg"></i>
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <p>No users found</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-sm text-gray-500">
                  {Array.from(selectedUserId).length} user{Array.from(selectedUserId).length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCollaborators}
                    disabled={Array.from(selectedUserId).length === 0}
                    className={`px-4 py-2 rounded-md text-white ${
                      Array.from(selectedUserId).length === 0 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } transition-colors`}
                  >
                    Add Selected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Project;