import socket from 'socket.io-client'

//We have to make three function here 
//one for intialization, one for send data and other one for recieve data

let socketInstance = null;

export const initializeSocket = (projectId)=>{
    
    socketInstance = socket(import.meta.env.VITE_BASE_SERVER_URL,{
        auth :{
            token : localStorage.getItem('token')
        },
        query:{
              projectId
        }
    });

    return socketInstance;
}

export const recieveMessage = (eventName,cb)=>{
   socketInstance.on(eventName,cb)
}

export const sendMessage = (eventName,cb)=>{
    socketInstance.emit(eventName,cb);
}