import { Routes, Route } from "react-router";
import Home from "@/pages/Home";
import AuthApp from "@/pages/AuthApp";
import ForgotPasswordPage from "@/pages/auths/ForgotPassword";
import RegisterPage from "@/pages/auths/Register";
// import BookManagement from "@/pages/books/BookManagement";
import MemberList from "@/pages/MembersManagement";
import CreateMember from "@/components/member/CreateMember";
import MemberDetail from "@/components/member/MemberDetail";
import MemberEdit from "@/components/member/MemberEdit";
import IssuePage from "@/pages/IssuePage";
import MemberTransactionsPage from "@/pages/MemberTransactionPage";
import ManageBooksPage from "@/pages/books/ManageBookPage";
import AddBookPage from "@/pages/books/AddBookPage";
import EditBookPage from "@/pages/books/EditBookPage";
import BookDetail from "@/components/books/BookDetail";
import TransactionDashboardPage from "@/pages/transactions/TransactionDashboardPage";
import ReturnBookWorkflow from "@/components/transactions/ReturnBookWorkflow";
import TransactionHistoryTable from "@/components/transactions/AllTransaction";
import RecordPaymentForm from "@/components/transactions/RecordPaymentForm";

const AppRoutes = () => {
    return (
        <Routes>
            <Route index element={<Home />} />  
            <Route path="/login" element={<AuthApp />} />
            <Route path="/forgot-password" element= {<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/books" element={<ManageBooksPage />} />
            <Route path="/books/new" element={<AddBookPage />} />
            <Route path="/books/edit/:bookId" element={<EditBookPage />} />
            <Route path="/books/:bookId" element={<BookDetail />} />
            <Route path="/members" element={<MemberList />} />
            <Route path="/members/create" element={<CreateMember />} />
            <Route path="/members/:memberId" element={<MemberDetail />} />
            <Route path="/members/edit/:memberId" element={<MemberEdit />} />
            <Route path="/issue" element={<IssuePage />} />
            <Route path="/members/:memberId/transactions" element={<MemberTransactionsPage />} />
            <Route path="/transactions/all" element = {<TransactionHistoryTable />} />
            <Route path="transactions" element={<TransactionDashboardPage/>} />
            <Route path="/transactions/return/book" element={<ReturnBookWorkflow />} />
            <Route path="/members/:memberId/pay-debt" element={<RecordPaymentForm />} />
        </Routes>
    )
}

export default AppRoutes;