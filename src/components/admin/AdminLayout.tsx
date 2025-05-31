import { ReactNode } from 'react';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import AdminNav from './AdminNav';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">{title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <aside>
              <AdminNav />
            </aside>
            
            <section className="bg-white rounded-lg shadow-md p-6">
              {children}
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLayout;