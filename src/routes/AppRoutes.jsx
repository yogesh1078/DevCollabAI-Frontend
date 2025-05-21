import react from 'react'
import { BrowserRouter,Route,Routes } from 'react-router-dom'
import LoginPage from '../pages/Login'
import RegisterPage from '../pages/Register'
import HomePage from '../pages/Home'
import Project from '../pages/Project'
import  UserAuth  from '../auth/UserAuth'

const AppRoutes = ()=>{
    return(
         <BrowserRouter>
          <Routes>
           <Route path='/' element = {<UserAuth> <HomePage></HomePage></UserAuth>}> </Route>
           <Route path='/login' element = {<LoginPage></LoginPage>}></Route>
           <Route path='/register' element = {<RegisterPage></RegisterPage>}> </Route>
           <Route path='/project' element = {<UserAuth> <Project></Project> </UserAuth>}> </Route>
          </Routes>
         
         
         </BrowserRouter>
    )
}

export default AppRoutes