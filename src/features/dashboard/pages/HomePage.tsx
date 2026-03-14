import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store'; // Adjust import path if needed

const HomePage: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-4 md:px-0">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-8 space-y-8">
            <span className="inline-block text-sm font-sans font-medium uppercase tracking-widest text-secondary">
              <span className="mr-2 text-accent">+</span>
              Healthcare reimagined
            </span>
            <h1 className="text-6xl md:text-8xl font-display font-medium text-primary leading-[0.9] -ml-1">
              Advanced<br />
              Medicine,<br />
              <span className="text-secondary opacity-60">Personalized.</span>
            </h1>
            <div className="pt-8 flex flex-wrap gap-6">
              <Link to="/doctors" className="inline-flex items-center space-x-2 text-lg font-medium border-b border-primary pb-1 hover:text-accent hover:border-accent transition-colors">
                <span>Find a Specialist</span>
                <span className="text-xl">→</span>
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="inline-flex items-center space-x-2 text-lg font-medium border-b border-transparent pb-1 text-secondary hover:text-primary transition-colors">
                  <span>Join NetruDoc</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Abstract visual element */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/3 h-2/3 bg-gradient-to-b from-soft-blue to-transparent opacity-20 blur-3xl rounded-full -z-10" />
      </section>

      {/* Services Section - Split Layout */}
      <section className="py-24 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="p-12 md:p-24 bg-soft-blue/30 flex flex-col justify-center min-h-[600px]">
            <span className="mb-6 text-sm font-sans font-medium uppercase tracking-widest text-secondary">
              <span className="mr-2 text-accent">+</span> Services
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-8 text-primary">
              Comprehensive<br />care for you.
            </h2>
            <p className="text-lg text-secondary max-w-md leading-relaxed">
              Connect with top-tier medical professionals through our secure platform. From digital prescriptions to video consultations, we bridge the gap between you and better health.
            </p>
          </div>
          <div className="relative min-h-[600px] bg-secondary/5 group overflow-hidden">
            {/* Placeholder for a high-quality medical image */}
            <img
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?ixlib=rb-4.0.3&auto=format&fit=crop&w=2091&q=80"
              alt="Doctor consultation"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
            />
            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500" />
          </div>
        </div>
      </section>

      {/* Feature List */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: 'Video Consultations', desc: 'Secure, HD video calls with specialists from the comfort of your home.' },
            { title: 'Digital Records', desc: 'Access your prescriptions and medical history anytime, anywhere.' },
            { title: 'Instant Booking', desc: 'Real-time availability and immediate confirmation for all appointments.' }
          ].map((feature, i) => (
            <div key={i} className="space-y-4 group cursor-pointer">
              <span className="block text-accent text-2xl group-hover:text-primary transition-colors duration-300">0{i + 1}</span>
              <h3 className="text-2xl font-display font-medium text-primary group-hover:translate-x-2 transition-transform duration-300">{feature.title}</h3>
              <p className="text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 text-center bg-primary text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <h2 className="text-5xl md:text-7xl font-display font-medium mb-8">Ready to start?</h2>
          <p className="text-xl text-gray-400 mb-12">Join thousands of patients experiencing the future of healthcare today.</p>
          <Link to="/register" className="inline-block px-12 py-4 border border-white/20 hover:bg-white hover:text-primary transition-all duration-300 text-lg font-medium rounded-full">
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

