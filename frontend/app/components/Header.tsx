import Link from 'next/link';
import { APP_NAME } from '../lib/constants';

export default function Header(): React.ReactElement {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          {APP_NAME}
        </Link>

        <ul className="flex space-x-8">
          <li>
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
          </li>
          <li>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
          </li>
          <li>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              Documentation
            </Link>
          </li>
          <li>
            <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
