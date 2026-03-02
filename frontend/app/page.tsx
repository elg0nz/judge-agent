import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import Card from './components/Card';
import { APP_NAME, APP_VERSION } from './lib/constants';

export default function Home(): React.ReactNode {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to {APP_NAME}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A judicial reasoning and decision-making platform powered by advanced AI agents
          </p>
          <p className="text-sm text-gray-500">
            Version {APP_VERSION}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card title="Reasoning Engine" description="Advanced judicial reasoning powered by DBOS and Agno agents" />
          <Card title="Type Safe" description="Built with TypeScript and strict type checking from day one" />
          <Card title="Production Ready" description="Follows industry best practices and community conventions" />
        </div>

        <div className="text-center">
          <Button
            label="Get Started"
            onClick={() => console.log('Get started clicked')}
            variant="primary"
          />
          <Button
            label="Learn More"
            onClick={() => console.log('Learn more clicked')}
            variant="secondary"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
