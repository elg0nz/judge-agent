import { APP_ATTRIBUTION, CURRENT_YEAR } from '../lib/constants';

export default function Footer(): React.ReactElement {
  return (
    <footer className="bg-gray-800 text-white py-8 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">Judge Agent</h4>
            <p className="text-gray-400">
              {APP_ATTRIBUTION}
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>
            &copy; {CURRENT_YEAR} Judge Agent. Built by Glo Maldonado (sanscourier.ai). made
            with love in Foggy, Outer Sunset, San Francisco, California).
          </p>
        </div>
      </div>
    </footer>
  );
}
