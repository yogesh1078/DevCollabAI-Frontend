import React from 'react'
import AppRoutes from './routes/AppRoutes';
import {UserProvider} from "../src/context/user.context"

const APP = ()=>{
  return(
          <UserProvider>
             <AppRoutes/>
          </UserProvider>
         
          
  )
}
export default APP; 