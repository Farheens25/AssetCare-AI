import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-slate-900">
          AssetCare<span className="text-blue-600">-AI</span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-slate-600 hover:text-blue-600">
            Features
          </a>

          <a href="#how-it-works" className="text-sm text-slate-600 hover:text-blue-600">
            How It Works
          </a>

          <a href="#ai-features" className="text-sm text-slate-600 hover:text-blue-600">
            AI Features
          </a>

          <a href="#faq" className="text-sm text-slate-600 hover:text-blue-600">
            FAQ
          </a>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden text-sm font-medium text-slate-600 hover:text-blue-600 sm:block"
          >
            Login
          </Link>

          <Link
            to="/signup"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;