import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        
        <div className="grid gap-8 md:grid-cols-4">
          
          {/* Brand */}
          <div>
            <Link to="/" className="text-xl font-bold text-slate-900">
              AssetCare<span className="text-blue-600">-AI</span>
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
              Smart warranty and asset management powered by AI.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-slate-900">Product</h3>

            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <a href="#features" className="block hover:text-blue-600">
                Features
              </a>

              <a href="#how-it-works" className="block hover:text-blue-600">
                How It Works
              </a>

              <a href="#ai-features" className="block hover:text-blue-600">
                AI Features
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-slate-900">Company</h3>

            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <a href="#about" className="block hover:text-blue-600">
                About
              </a>

              <a href="#faq" className="block hover:text-blue-600">
                FAQ
              </a>

              <a href="#contact" className="block hover:text-blue-600">
                Contact
              </a>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-slate-900">Account</h3>

            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <Link to="/login" className="block hover:text-blue-600">
                Login
              </Link>

              <Link to="/signup" className="block hover:text-blue-600">
                Sign Up
              </Link>

              <Link to="/dashboard" className="block hover:text-blue-600">
                Dashboard
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          © 2026 AssetCare-AI. All rights reserved.
        </div>

      </div>
    </footer>
  );
}

export default Footer;