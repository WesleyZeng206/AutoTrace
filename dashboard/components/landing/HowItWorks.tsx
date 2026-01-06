import { Package, Settings, LineChart } from 'lucide-react';

const steps = [ {
    icon: Package,
    title: 'Install the Package',
    description: 'Add our NPM package to your project with a single command. Compatible with all modern JavaScript frameworks.',
    code: 'npm install @wesleyzeng206/autotrace',
  },
  {
    icon: Settings,
    title: 'Configure & Initialize',
    description: 'Initialize the tracker with your API key. Customize what metrics you want to track and set up your preferences.',
    code: `import { createAutoTraceMiddleware } from '@wesleyzeng206/autotrace';

app.use(createAutoTraceMiddleware({
  serviceName: 'my-service',
  ingestionUrl: 'http://localhost:4000',
  apiKey: 'your-api-key'
}));`,
  },
  {
    icon: LineChart,
    title: 'View Your Dashboard',
    description: 'Log in to your dashboard to see real-time analytics, performance metrics, and user insights all in one place.',
    code: null,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-xl text-gray-600">
            Three simple steps to start monitoring your application's performance and user behavior.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-200">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className="w-6 h-6 text-blue-600" />
                        <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 mb-4">{step.description}</p>
                    </div>
                  </div>

                  {step.code && (
                    <div className="w-full lg:w-1/2">
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-emerald-400 p-4 rounded-lg font-mono text-sm overflow-x-auto shadow-lg border border-slate-700">
                        <pre className="whitespace-pre">{step.code}</pre>
                      </div>
                    </div>
                  )}

                  {!step.code && (
                    <div className="w-full lg:w-1/2">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-8 shadow-lg">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                            <div className="h-2 bg-white/80 rounded flex-1"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                            <div className="h-2 bg-white/60 rounded flex-1 w-3/4"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                            <div className="h-2 bg-white/40 rounded flex-1 w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
