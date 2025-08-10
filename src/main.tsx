import './index.css'
import App from './App.tsx'
import { Provider } from "react-redux";
import { store } from './store/store.ts'
import Login from './components/Login.tsx';
import { createRoot } from 'react-dom/client'
import VerifyOtp from './pages/VerifyOtp.tsx';
import { ChakraProvider } from '@chakra-ui/react'
import Register from './components/Register.tsx';
import QuizAssessmentSystem from './pages/Home.tsx'
import ResetPassword from './pages/ResetPassword.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path:"/",
    element: <App/>,
    children: [
      {
        path: "",
        element: <QuizAssessmentSystem/>
      },
      { path: "/login",element: <Login/>},
      { path: "/signup",element: <Register/>},
      { path: "/verify", element: <VerifyOtp /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },

    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ChakraProvider>
      <RouterProvider router={router}/>
    </ChakraProvider>
  </Provider>
)
