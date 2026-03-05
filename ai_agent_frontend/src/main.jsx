import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // Import thư viện
import App from './App.jsx'
import './index.css'

// 1. Khởi tạo một thực thể QueryClient để quản lý cache và các request
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
     
      staleTime: 1000 * 60 * 5, // 5 phút
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Bao bọc App bằng QueryClientProvider và truyền queryClient vào */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)